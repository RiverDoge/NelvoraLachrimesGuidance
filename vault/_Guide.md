# How this vault becomes the site

Everything under `Xeryos/` is published. Push to GitHub and the site updates about a minute later.

Anything whose name starts with `_` is ignored, including this note and `_Templates`.

## Folders

```
Xeryos/
  02 The Reverent Heart/              champion
    Church of the Reverent Heart.md   main faction (Faction Info tab)
    Emblem.png                        grid button and page corners
    Leader.png                        leader portrait
    Objectives/                       the main faction's objectives
    Individuals/                      the main faction's people
    Sub-Factions/
      Tidewardens/                    one folder per sub-faction
        Tidewardens.md
        Objectives/
        Individuals/
```

## Rules

- **Champion folder:** `02 The Reverent Heart`. The number sets the order on the front page and is not shown.
- **Main faction:** the one note sitting directly in the champion folder. Its file name is the faction name.
- **Sub-faction:** a folder inside `Sub-Factions`, with one note inside for its details. A single note in `Sub-Factions` works too if it has no members yet.
- **Objectives and Individuals:** one note per card. The file name is the card's name. Which faction it belongs to comes from the folder it is in.
- **Properties** are the stat fields. Use the templates so the names are right. Leave one blank and the site shows *Unknown*.
- **The note body** is the description. Normal formatting works.
- **Undiscovered slots:** name a note `Unknown`, `Unknown 2` and so on. It shows as an *Unknown* card. Rename it once the party finds out who or what it is.
- **Order:** cards are alphabetical, with undiscovered ones last. Put a number in front (`01 Gregory`, `03 Unknown`) to force an order. The number is not shown.
- **Objective status:** `Ongoing` is highlighted, `Completed` is muted and `Failed` is struck through. Anything else (like `Planned`) shows plainly.
- **Art:** `Emblem` and `Leader` images go in the champion folder (png, jpg or webp). Without them the placeholder is used, and a champion with no `Leader` image shows an empty frame. Use the full-size art: the site shows small copies on the page and opens the full image when someone clicks it.
- **Names with `:` `?` or `"`:** file names can't have these, so add a `Name` property with the real name.

## What players can see

- An *Unknown* card only hides the name. Any properties or description you fill in still show on it.
- `%% comments %%` are hidden on the site, but anyone can read the notes on GitHub, comments included.
- Each champion has its own link, e.g. `.../NelvoraLachrimesGuidance/#the-reverent-heart`, handy for pointing players at a page.

## If the site doesn't update

Check the Actions tab of the repo on GitHub. A red run means a note couldn't be read, and the message names the file. The old site stays up until it is fixed.

## Templates

Settings > Core plugins > Templates, then set the template folder to `_Templates`. After that, "Insert template" on a new note fills in the right properties.
