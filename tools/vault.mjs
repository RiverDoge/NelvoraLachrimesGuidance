import fs from 'fs';
import path from 'path';
import { load } from 'js-yaml';

export const VAULT = 'vault';
export const SECTION = 'Xeryos';
export const IMAGE_TYPES = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
const OBSIDIAN_PROPERTIES = ['tags', 'aliases', 'cssclasses'];

export const FIELDS = {
    faction: ['Leader Name', 'Leader Danger', 'Combat Style', 'Size of Forces', 'Overall Danger Level', 'HQ Location', 'HQ Danger Level', 'HQ Features', 'HQ Accessibility', 'HQ Description', 'Unique Abilities', 'Strengths', 'Weaknesses', 'Interests', 'Alliances', 'Enemies', 'Likes', 'Dislikes'],
    subFaction: ['Leader Name', 'Size of Forces', 'Overall Danger Level', 'Alliances', 'Enemies'],
    objective: ['Status', 'Objective Giver', 'Difficulty', 'Location', 'Reward'],
    individual: ['Challenge Rating', 'Strengths', 'Weaknesses', 'Allies', 'Enemies']
};

export class VaultError extends Error {}

const undiscovered = new WeakSet();
let warnings = [];
let withSources = false;

function warn(location, message) {
    warnings.push(`${location}: ${message}`);
}

function fail(location, message) {
    throw new VaultError(`${location}: ${message}`);
}

export function list(dir) {
    return fs.readdirSync(dir, { withFileTypes: true })
        .filter(entry => !entry.name.startsWith('_') && !entry.name.startsWith('.'))
        .sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));
}

export function isNote(entry) {
    return entry.isFile() && path.extname(entry.name).toLowerCase() === '.md';
}

export function withoutExtension(fileName) {
    return path.basename(fileName, path.extname(fileName));
}

function folderKey(name) {
    return name.toLowerCase().replace(/[^a-z]/g, '');
}

export function subfolder(dir, name) {
    const match = list(dir).find(entry => entry.isDirectory() && folderKey(entry.name) === folderKey(name));
    return match ? path.join(dir, match.name) : null;
}

function checkFolders(dir, expected) {
    const keys = expected.map(folderKey);
    list(dir)
        .filter(entry => entry.isDirectory() && !keys.includes(folderKey(entry.name)))
        .forEach(entry => warn(path.join(dir, entry.name), `the site only reads ${expected.join(', ')} here`));
}

function soleNote(dir) {
    const notes = list(dir).filter(isNote);
    if (notes.length > 1) {
        fail(dir, `more than one note at this level (${notes.map(note => note.name).join(', ')}), only the faction's own note belongs here`);
    }
    return notes.length ? path.join(dir, notes[0].name) : null;
}

export function stripOrder(name) {
    return name.replace(/^\d+[\s.\-]+/, '');
}

export function displayName(name) {
    const stripped = stripOrder(name);
    return /^unknown(\s*\d+)?$/i.test(stripped) ? '' : stripped;
}

function plainLinks(text) {
    return text
        .replace(/!\[\[[^\]]*\]\]/g, '')
        .replace(/\[\[([^\]]+)\]\]/g, (match, link) => {
            const [target, alias] = link.split('|');
            return (alias || target.split('/').pop()).trim();
        });
}

function toText(value) {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return value.map(toText).filter(Boolean).join(', ');
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return plainLinks(String(value)).trim();
}

function readProperties(file, lines) {
    try {
        return load(lines.join('\n')) || {};
    } catch (error) {
        const line = error.mark ? ` on line ${error.mark.line + 2}` : '';
        fail(file, `the properties could not be read${line} (${error.reason || error.message})`);
    }
}

export function splitNote(file) {
    const lines = fs.readFileSync(file, 'utf8').replace(/^﻿/, '').split(/\r?\n/);
    let raw = {};
    let body = lines;

    if (lines[0].trim() === '---') {
        const end = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
        if (end === -1) fail(file, 'the properties block is never closed with ---');
        raw = readProperties(file, lines.slice(1, end));
        body = lines.slice(end + 1);
    }

    if (typeof raw !== 'object' || Array.isArray(raw)) {
        fail(file, 'the properties must be "Name: value" lines');
    }

    return { raw, body: body.join('\n') };
}

function readNote(file, kind) {
    const { raw, body } = splitNote(file);

    const properties = {};
    for (const [name, value] of Object.entries(raw)) {
        const lowered = name.trim().toLowerCase();
        const field = FIELDS[kind].find(known => known.toLowerCase() === lowered);
        if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
            fail(file, `"${name}" has nested values, it must be plain text or a list`);
        }
        if (field) properties[field] = toText(value);
        else if (lowered === 'name') properties.Name = toText(value);
        else if (!OBSIDIAN_PROPERTIES.includes(lowered)) warn(file, `"${name}" is not a property the site uses`);
    }

    return {
        properties,
        body: plainLinks(body.replace(/%%[\s\S]*?%%/g, '')).trim(),
        rawBody: body.trim()
    };
}

function sourced(record, extra) {
    return withSources ? { ...record, ...extra } : record;
}

function markUndiscovered(record, name, fileName) {
    if (!name && /^unknown(\s*\d+)?$/i.test(fileName)) undiscovered.add(record);
    return record;
}

function undiscoveredLast(records) {
    return [...records.filter(record => !undiscovered.has(record)), ...records.filter(record => undiscovered.has(record))];
}

function readCards(folder, kind, nameField, factionName) {
    if (!folder) return [];
    return list(folder).filter(isNote).map(entry => {
        const file = path.join(folder, entry.name);
        const note = readNote(file, kind);
        const { Name, ...fields } = note.properties;
        const name = Name || displayName(withoutExtension(entry.name));
        return markUndiscovered(sourced({
            [nameField]: name,
            'Faction Name': factionName,
            ...fields,
            'Description': note.body
        }, { source: file, body: note.rawBody }), name, withoutExtension(entry.name));
    });
}

function readMembers(dir, factionName) {
    return {
        objectives: readCards(subfolder(dir, 'Objectives'), 'objective', 'Objective Name', factionName),
        individuals: readCards(subfolder(dir, 'Individuals'), 'individual', 'Name', factionName)
    };
}

function readSubFactions(folder) {
    if (!folder) return [];
    return list(folder).filter(entry => entry.isDirectory() || isNote(entry)).map(entry => {
        const location = path.join(folder, entry.name);
        const isFolder = entry.isDirectory();
        const noteFile = isFolder ? soleNote(location) : location;
        if (!noteFile) warn(location, 'has no note, so its card will be blank');
        if (isFolder) checkFolders(location, ['Objectives', 'Individuals']);

        const note = noteFile ? readNote(noteFile, 'subFaction') : { properties: {}, body: '', rawBody: '' };
        const { Name, ...fields } = note.properties;
        const name = Name || displayName(isFolder ? entry.name : withoutExtension(entry.name));
        const members = isFolder ? readMembers(location, name) : { objectives: [], individuals: [] };

        return {
            record: markUndiscovered(sourced(
                { 'Faction Name': name, ...fields, 'Description': note.body },
                { source: noteFile, folder: isFolder ? location : null, body: note.rawBody }
            ), name, isFolder ? entry.name : withoutExtension(entry.name)),
            ...members
        };
    });
}

function findArt(dir, name) {
    const match = list(dir).find(entry => entry.isFile()
        && IMAGE_TYPES.includes(path.extname(entry.name).toLowerCase())
        && withoutExtension(entry.name).toLowerCase() === name);
    if (!match) return '';
    return path.join(dir, match.name)
        .split(path.sep)
        .map(part => encodeURIComponent(part).replace(/'/g, '%27'))
        .join('/');
}

function readChampion(entry) {
    const dir = path.join(VAULT, SECTION, entry.name);
    const noteFile = soleNote(dir);
    if (!noteFile) warn(dir, 'has no faction note');
    checkFolders(dir, ['Objectives', 'Individuals', 'Sub-Factions']);

    const note = noteFile ? readNote(noteFile, 'faction') : { properties: {}, body: '', rawBody: '' };
    const { Name, ...fields } = note.properties;
    const factionName = Name || (noteFile ? displayName(withoutExtension(noteFile)) : '');
    const own = readMembers(dir, factionName);
    const subFactions = readSubFactions(subfolder(dir, 'Sub-Factions'));

    return sourced({
        name: stripOrder(entry.name),
        emblem: findArt(dir, 'emblem'),
        leaderArt: findArt(dir, 'leader'),
        faction: sourced(
            { 'Faction Name': factionName, ...fields, 'Faction Description': note.body },
            { source: noteFile, body: note.rawBody }
        ),
        subFactions: undiscoveredLast(subFactions.map(sub => sub.record)),
        objectives: undiscoveredLast([...own.objectives, ...subFactions.flatMap(sub => sub.objectives)]),
        individuals: undiscoveredLast([...own.individuals, ...subFactions.flatMap(sub => sub.individuals)])
    }, { folder: dir });
}

export function readVault({ sources = false } = {}) {
    warnings = [];
    withSources = sources;
    const root = path.join(VAULT, SECTION);
    const champions = list(root).filter(entry => entry.isDirectory()).map(readChampion);
    return { champions, warnings };
}
