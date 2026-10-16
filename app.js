const PLACEHOLDER_ART = 'assets/champion_art/Placeholder_12.png';
const STATUS_BADGES = { ongoing: 'badge-highlight', completed: 'badge-complete', failed: 'badge-failed' };
const SITE_TITLE = document.title;
let champions = [];
let shownChampion = null;
let placeholderThumb = PLACEHOLDER_ART;

function loadChampions() {
    fetch("data/xeryos.json", { cache: "no-cache" })
        .then(response => {
            if (!response.ok) throw new Error(response.status);
            return response.json();
        })
        .then(data => {
            champions = data.champions;
            placeholderThumb = data.placeholderThumb || PLACEHOLDER_ART;
            renderChampionGrid();
            showRoute();
        })
        .catch(error => {
            console.error("Data Load Error:", error);
            document.getElementById("grid-container").innerHTML = `<p style="color:var(--xeryos-crimson-bright); font-weight:bold; grid-column: 1 / -1;">Error loading data.</p>`;
        });
}

function emblemFull(champion) {
    return champion.emblem || PLACEHOLDER_ART;
}

function emblemShown(champion) {
    return champion.emblem ? champion.emblemThumb || champion.emblem : placeholderThumb;
}

function renderChampionGrid() {
    document.getElementById("grid-container").innerHTML = champions.map((champion, index) => `
        <button type="button" class="champion-card" onclick="loadChampionData(${index})">
            <img src="${emblemShown(champion)}" alt="${champion.name}" class="champion-image-btn" onerror="this.onerror=null; this.src='${PLACEHOLDER_ART}';">
            <span class="champion-name${/^unknown$/i.test(champion.name) ? ' ghost-text' : ''}" aria-hidden="true">${champion.name}</span>
        </button>
    `).join('');
}

function slugFor(champion) {
    return champion.name
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/['’]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function routeSlug() {
    try {
        return decodeURIComponent(location.hash.slice(1));
    } catch (error) {
        return '';
    }
}

function showRoute() {
    const index = champions.findIndex(champion => slugFor(champion) === routeSlug());
    if (index === -1) {
        if (shownChampion !== null) showGrid();
        return;
    }
    if (index !== shownChampion) loadChampionData(index);
}

function formatData(value) {
    if (!value || value.trim() === '' || value.trim().toLowerCase() === 'unknown' || value.trim().toLowerCase() === 'n/a' || value.trim().toLowerCase() === 'none') {
        return `<span class="ghost-text">Unknown</span>`;
    }
    return value;
}

function formatBody(value) {
    const formatted = formatData(value);
    return formatted === value ? marked.parse(value, { breaks: true }) : formatted;
}

function loadChampionData(index) {
    const champion = champions[index];
    const emblem = emblemFull(champion);
    const shown = emblemShown(champion);
    const slug = slugFor(champion);

    if (routeSlug() !== slug) history.pushState({ fromGrid: shownChampion === null }, '', `#${slug}`);
    shownChampion = index;

    document.getElementById("main-header").classList.add("hidden");
    document.getElementById("champion-selection").classList.add("hidden");
    document.getElementById("champion-details").classList.remove("hidden");
    document.getElementById("return-btn").classList.remove("hidden");

    window.scrollTo(0, 0);

    document.title = `${champion.name} · ${SITE_TITLE}`;
    document.getElementById("detail-title").innerText = champion.name;

    const imgLeft = document.getElementById("detail-header-image-left");
    const imgRight = document.getElementById("detail-header-image-right");

    imgLeft.src = shown;
    imgRight.src = shown;
    imgLeft.dataset.full = emblem;
    imgRight.dataset.full = emblem;

    imgLeft.onerror = function() { this.onerror = null; this.src = PLACEHOLDER_ART; };
    imgRight.onerror = function() { this.onerror = null; this.src = PLACEHOLDER_ART; };

    populateTabs(champion.faction, champion.subFactions, champion.objectives, champion.individuals, champion.leaderArt, champion.leaderThumb || champion.leaderArt);
}

function populateTabs(faction, subFactions, objectives, individuals, leaderFull, leaderShown) {
    const allFactions = [];
    if (faction['Faction Name']) allFactions.push(faction['Faction Name']);
    subFactions.forEach(sub => { if (sub['Faction Name']) allFactions.push(sub['Faction Name']); });
    objectives.forEach(obj => { if (obj['Faction Name']) allFactions.push(obj['Faction Name']); });
    individuals.forEach(ind => { if (ind['Faction Name']) allFactions.push(ind['Faction Name']); });
    
    const uniqueFactions = [...new Set(allFactions.filter(f => f && f.trim() !== '' && f.toLowerCase() !== 'unknown' && f.toLowerCase() !== 'n/a'))];

    const leaderPortrait = leaderFull
        ? `<div class="leader-portrait-wrapper" onclick="openLightbox('${leaderFull}')">
                <img src="${leaderShown}" alt="Leader Art" class="leader-portrait-img" onerror="this.onerror=null; this.src='${leaderFull}';">
            </div>`
        : `<div class="leader-portrait-wrapper leader-portrait-empty"><span>?</span></div>`;

    document.getElementById("tab-faction").innerHTML = `
        <div class="faction-hero">
            <h3>${formatData(faction['Faction Name'])}</h3>
            <div class="entity-desc">${formatBody(faction['Faction Description'])}</div>
        </div>
        
        <div class="leader-combo-box">
            ${leaderPortrait}

            <div class="leader-info-card">
                <div class="leader-title-wrap">
                    <span class="stat-label">Faction Leader</span>
                    <h4>${formatData(faction['Leader Name'])}</h4>
                </div>
                <div class="leader-stats-row">
                    <div class="stat-block"><span class="stat-label">Combat Style</span><span class="stat-value">${formatData(faction['Combat Style'])}</span></div>
                    <div class="stat-block"><span class="stat-label">Forces</span><span class="stat-value">${formatData(faction['Size of Forces'])}</span></div>
                    <div class="stat-block"><span class="stat-label">Overall Danger</span><span class="stat-value danger-text">${formatData(faction['Overall Danger Level'])}</span></div>
                </div>
            </div>

            <div class="leader-spacer"></div>

            <span class="top-right-badge badge-danger">CR: ${formatData(faction['Leader Danger'])}</span>
        </div>

        <div class="info-grid">
            <div class="info-panel">
                <h4>Headquarters Information</h4>
                <div class="stat-block"><span class="stat-label">Location</span> <span class="stat-value">${formatData(faction['HQ Location'])}</span></div>
                <div class="stat-block"><span class="stat-label">Danger Level</span> <span class="stat-value danger-text">${formatData(faction['HQ Danger Level'])}</span></div>
                <div class="stat-block"><span class="stat-label">Features</span> <span class="stat-value">${formatData(faction['HQ Features'])}</span></div>
                <div class="stat-block"><span class="stat-label">Accessibility</span> <span class="stat-value">${formatData(faction['HQ Accessibility'])}</span></div>
                <div class="stat-block"><span class="stat-label">Details</span> <span class="stat-value" style="font-size: 1rem; font-weight: normal;">${formatData(faction['HQ Description'])}</span></div>
            </div>
            <div class="info-panel">
                <h4>Alignments & Capabilities</h4>
                <div class="stat-block"><span class="stat-label">Unique Abilities</span> <span class="stat-value">${formatData(faction['Unique Abilities'])}</span></div>
                <div class="stat-block"><span class="stat-label">Strengths</span> <span class="stat-value">${formatData(faction['Strengths'])}</span></div>
                <div class="stat-block"><span class="stat-label">Weaknesses</span> <span class="stat-value">${formatData(faction['Weaknesses'])}</span></div>
                <div class="stat-block"><span class="stat-label">Interests</span> <span class="stat-value">${formatData(faction['Interests'])}</span></div>
                <div class="stat-block"><span class="stat-label">Alliances</span> <span class="stat-value">${formatData(faction['Alliances'])}</span></div>
                <div class="stat-block"><span class="stat-label">Enemies</span> <span class="stat-value">${formatData(faction['Enemies'])}</span></div>
            </div>
        </div>
    `;

    let subHtml = '';
    if (subFactions.length === 0) {
        subHtml = "<div class='entity-grid'><p class='ghost-text' style='grid-column: 1 / -1;'>No sub-factions recorded.</p></div>";
    } else {
        subHtml = '<div class="subfactions-list">';
        subFactions.forEach((sub, index) => {
            subHtml += `
            <div class="field-note-card">
                <span class="top-right-badge badge-danger">${formatData(sub['Overall Danger Level'])} Danger</span>
                <h3>${formatData(sub['Faction Name'])}</h3>
                <div class="entity-desc">${formatBody(sub['Description'])}</div>
                <div class="entity-footer">
                    <div class="stat-block"><span class="stat-label">Leader</span> <span class="stat-value">${formatData(sub['Leader Name'])}</span></div>
                    <div class="stat-block"><span class="stat-label">Forces</span> <span class="stat-value">${formatData(sub['Size of Forces'])}</span></div>
                    <div class="stat-block"><span class="stat-label">Alliances</span> <span class="stat-value">${formatData(sub['Alliances'])}</span></div>
                    <div class="stat-block"><span class="stat-label">Enemies</span> <span class="stat-value">${formatData(sub['Enemies'])}</span></div>
                </div>
            </div>`;
            
            if (subFactions.length > 1 && index < subFactions.length - 1) {
                subHtml += `<img src="assets/UI/horizontalbar_2.png" alt="Divider" class="subfaction-divider-img">`;
            }
        });
        subHtml += '</div>';
    }
    document.getElementById("tab-subfactions").innerHTML = subHtml;

    let objHtml = '';
    if (objectives.length === 0) {
        objHtml += "<div class='entity-grid'><p class='ghost-text' style='grid-column: 1 / -1;'>No active objectives recorded.</p></div>";
    } else {
        objHtml += `
            <div class="filter-container">
                <label for="obj-filter">Filter by Faction:</label>
                <select id="obj-filter" onchange="filterCards('tab-objectives', this.value)">
                    <option value="All">All Factions</option>
                    ${uniqueFactions.map(f => `<option value="${f}">${f}</option>`).join('')}
                </select>
            </div>
            <div class="entity-grid">
        `;
        objectives.forEach(obj => {
            let statusBadge = STATUS_BADGES[String(obj['Status'] || '').trim().toLowerCase()] || 'badge-neutral';
            let safeFaction = obj['Faction Name'] || 'Unknown';
            
            objHtml += `
            <div class="field-note-card expandable-card filterable-card" data-faction="${safeFaction}" onclick="toggleExpand(this)">
                <span class="top-right-badge ${statusBadge}">${formatData(obj['Status'])}</span>
                <h3>${formatData(obj['Objective Name'])}</h3>
                
                <div class="collapsible-stats">
                    <div class="entity-desc">${formatBody(obj['Description'])}</div>
                    <div class="entity-footer">
                        <div class="stat-block"><span class="stat-label">Overseer</span> <span class="stat-value">${formatData(obj['Objective Giver'])}</span></div>
                        <div class="stat-block"><span class="stat-label">Difficulty</span> <span class="stat-value">${formatData(obj['Difficulty'])}</span></div>
                        <div class="stat-block"><span class="stat-label">Location</span> <span class="stat-value">${formatData(obj['Location'])}</span></div>
                        <div class="stat-block"><span class="stat-label">Reward</span> <span class="stat-value">${formatData(obj['Reward'])}</span></div>
                        <div class="stat-block"><span class="stat-label" style="color: var(--text-muted);">Faction</span> <span class="stat-value" style="font-size: 1rem;">${formatData(obj['Faction Name'])}</span></div>
                    </div>
                </div>
            </div>`;
        });
        objHtml += '</div>';
    }
    document.getElementById("tab-objectives").innerHTML = objHtml;

    let indHtml = '';
    if (individuals.length === 0) {
        indHtml += "<div class='entity-grid'><p class='ghost-text' style='grid-column: 1 / -1;'>No notable individuals recorded.</p></div>";
    } else {
        indHtml += `
            <div class="filter-container">
                <label for="ind-filter">Filter by Faction:</label>
                <select id="ind-filter" onchange="filterCards('tab-individuals', this.value)">
                    <option value="All">All Factions</option>
                    ${uniqueFactions.map(f => `<option value="${f}">${f}</option>`).join('')}
                </select>
            </div>
            <div class="entity-grid">
        `;
        individuals.forEach(ind => {
            let safeFaction = ind['Faction Name'] || 'Unknown';
            indHtml += `
            <div class="field-note-card expandable-card filterable-card" data-faction="${safeFaction}" onclick="toggleExpand(this)">
                <span class="top-right-badge badge-danger">CR: ${formatData(ind['Challenge Rating'])}</span>
                <h3>${formatData(ind['Name'])}</h3>
                
                <div class="collapsible-stats">
                    <div class="entity-desc">${formatBody(ind['Description'])}</div>
                    <div class="entity-footer">
                        <div class="stat-block"><span class="stat-label">Strengths</span> <span class="stat-value">${formatData(ind['Strengths'])}</span></div>
                        <div class="stat-block"><span class="stat-label">Weaknesses</span> <span class="stat-value">${formatData(ind['Weaknesses'])}</span></div>
                        <div class="stat-block"><span class="stat-label">Allies</span> <span class="stat-value">${formatData(ind['Allies'])}</span></div>
                        <div class="stat-block"><span class="stat-label">Enemies</span> <span class="stat-value">${formatData(ind['Enemies'])}</span></div>
                        <div class="stat-block"><span class="stat-label" style="color: var(--text-muted);">Faction</span> <span class="stat-value" style="font-size: 1rem;">${formatData(ind['Faction Name'])}</span></div>
                    </div>
                </div>
            </div>`;
        });
        indHtml += '</div>';
    }
    document.getElementById("tab-individuals").innerHTML = indHtml;
}

function toggleExpand(cardElement) {
    const statsContainer = cardElement.querySelector('.collapsible-stats');
    
    if (statsContainer.classList.contains('open')) {
        statsContainer.classList.remove('open');
    } else {
        statsContainer.classList.add('open');
    }
}

function filterCards(tabId, selectedFaction) {
    const tab = document.getElementById(tabId);
    const cards = tab.getElementsByClassName('filterable-card');
    for (let i = 0; i < cards.length; i++) {
        if (selectedFaction === 'All' || cards[i].getAttribute('data-faction') === selectedFaction) {
            cards[i].style.display = 'flex';
        } else {
            cards[i].style.display = 'none';
        }
    }
}

function openTab(evt, tabId) {
    const tabContents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove("active");
    }
    
    const tabLinks = document.getElementsByClassName("bookmark-link");
    for (let i = 0; i < tabLinks.length; i++) {
        tabLinks[i].classList.remove("active");
    }
    
    document.getElementById(tabId).classList.add("active");
    evt.currentTarget.classList.add("active");
}

function returnToGrid() {
    if (history.state && history.state.fromGrid) return history.back();
    history.replaceState(null, '', location.pathname + location.search);
    showGrid();
}

function showGrid() {
    shownChampion = null;
    document.getElementById("champion-details").classList.add("hidden");
    document.getElementById("return-btn").classList.add("hidden");
    document.getElementById("champion-selection").classList.remove("hidden");
    document.getElementById("main-header").classList.remove("hidden");
    document.title = SITE_TITLE;

    window.scrollTo(0, 0);
}

function openLightbox(imgSrc) {
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    
    lightboxImg.src = imgSrc;
    lightbox.classList.remove("hidden");
}

function closeLightbox() {
    document.getElementById("lightbox").classList.add("hidden");
}

window.addEventListener('popstate', showRoute);
window.addEventListener('hashchange', showRoute);

loadChampions();