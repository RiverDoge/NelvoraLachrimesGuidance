function fetchCSV(url) {
    return new Promise((resolve, reject) => {
        Papa.parse(url, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: results => resolve(results.data),
            error: err => reject(err)
        });
    });
}

function formatData(value) {
    if (!value || value.trim() === '' || value.trim().toLowerCase() === 'unknown' || value.trim().toLowerCase() === 'n/a' || value.trim().toLowerCase() === 'none') {
        return `<span class="ghost-text">Classified</span>`;
    }
    return value;
}

function loadChampionData(championName, imageName) {
    // Hide Title and Main Grid, Show Details and Return Button
    document.getElementById("main-header").classList.add("hidden");
    document.getElementById("champion-selection").classList.add("hidden");
    document.getElementById("champion-details").classList.remove("hidden");
    document.getElementById("return-btn").classList.remove("hidden");
    
    document.getElementById("detail-title").innerText = championName;
    
    const headerImg = document.getElementById("detail-header-image");
    headerImg.src = `assets/champion_art/${imageName}`;
    headerImg.onerror = function() {
        this.onerror = null;
        this.src = 'assets/champion_art/Placeholder_12.png';
    };
    
    Promise.all([
        fetchCSV("data/Xeryos_Factions_DB.csv"),
        fetchCSV("data/Xeryos_Sub-Factions_DB.csv"),
        fetchCSV("data/Xeryos_Objectives_DB.csv"),
        fetchCSV("data/Xeryos_Individuals_DB.csv")
    ]).then(([factions, subFactions, objectives, individuals]) => {
        
        const factionData = factions.find(row => row.Champion === championName) || {};
        const subFactionData = subFactions.filter(row => row.Champion === championName);
        const objectiveData = objectives.filter(row => row.Champion === championName);
        const individualData = individuals.filter(row => row.Champion === championName);
        
        populateTabs(factionData, subFactionData, objectiveData, individualData, championName);
    }).catch(error => {
        console.error("Data Load Error:", error);
        document.getElementById("tab-faction").innerHTML = `<p style="color:var(--xeryos-crimson-bright); font-weight:bold;">Error loading data.</p>`;
    });
}

function populateTabs(faction, subFactions, objectives, individuals, championName) {
    const formattedName = championName.replace(/\s+/g, '_');
    const leaderImg = `assets/leader_art/${formattedName}_Leader.png`;

    // 1. FACTION INFO TAB (Now includes Leader and HQ to save vertical space)
    document.getElementById("tab-faction").innerHTML = `
        <div class="faction-hero">
            <h3>${formatData(faction['Faction Name'])}</h3>
            <p class="entity-desc">${formatData(faction['Faction Description'])}</p>
        </div>
        
        <div class="base-card leader-horizontal-card">
            <img src="${leaderImg}" alt="Leader Art" class="leader-portrait-large" onclick="openLightbox(this.src)" onerror="this.onerror=null; this.src='assets/champion_art/Placeholder_12.png';">
            
            <div class="leader-info-block">
                <div class="leader-title-wrap">
                    <span class="stat-label">Faction Leader</span>
                    <h4>${formatData(faction['Leader Name'])} <span class="danger-text" style="font-size:0.9rem; margin-left:5px;">(CR: ${formatData(faction['Leader Danger'])})</span></h4>
                </div>
                <div class="leader-stats-row">
                    <div class="stat-block"><span class="stat-label">Combat Style</span><span class="stat-value">${formatData(faction['Combat Style'])}</span></div>
                    <div class="stat-block"><span class="stat-label">Force Size</span><span class="stat-value">${formatData(faction['Size of Forces'])}</span></div>
                    <div class="stat-block"><span class="stat-label">Overall Danger</span><span class="stat-value danger-text">${formatData(faction['Overall Danger Level'])}</span></div>
                </div>
            </div>
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

    // 2. SUB-FACTIONS TAB
    let subHtml = '<div class="entity-grid">';
    if (subFactions.length === 0) {
        subHtml += "<p class='ghost-text' style='grid-column: 1 / -1;'>No sub-factions recorded.</p>";
    } else {
        subFactions.forEach(sub => {
            subHtml += `
            <div class="field-note-card">
                <h3>${formatData(sub['Faction Name'])}</h3>
                <span class="badge badge-danger">${formatData(sub['Overall Danger Level'])} Danger</span>
                <p class="entity-desc">${formatData(sub['Description'])}</p>
                <div class="entity-footer">
                    <div class="stat-block"><span class="stat-label">Leader</span> <span class="stat-value">${formatData(sub['Leader Name'])}</span></div>
                    <div class="stat-block"><span class="stat-label">Force Size</span> <span class="stat-value">${formatData(sub['Size of Forces'])}</span></div>
                    <div class="stat-block"><span class="stat-label">Alliances</span> <span class="stat-value">${formatData(sub['Alliances'])}</span></div>
                    <div class="stat-block"><span class="stat-label">Enemies</span> <span class="stat-value">${formatData(sub['Enemies'])}</span></div>
                </div>
            </div>`;
        });
    }
    subHtml += '</div>';
    document.getElementById("tab-subfactions").innerHTML = subHtml;

    // 3. OBJECTIVES TAB
    let objHtml = '<div class="entity-grid">';
    if (objectives.length === 0) {
        objHtml += "<p class='ghost-text' style='grid-column: 1 / -1;'>No active objectives recorded.</p>";
    } else {
        objectives.forEach(obj => {
            let statusBadge = obj['Status'] === 'Ongoing' ? 'badge-highlight' : 'badge-neutral';
            objHtml += `
            <div class="field-note-card">
                <h3>${formatData(obj['Objective Name'])}</h3>
                <span class="badge ${statusBadge}">${formatData(obj['Status'])}</span>
                <p class="entity-desc">${formatData(obj['Description'])}</p>
                <div class="entity-footer">
                    <div class="stat-block"><span class="stat-label">Overseer</span> <span class="stat-value">${formatData(obj['Objective Giver'])}</span></div>
                    <div class="stat-block"><span class="stat-label">Difficulty</span> <span class="stat-value">${formatData(obj['Difficulty'])}</span></div>
                    <div class="stat-block"><span class="stat-label">Location</span> <span class="stat-value">${formatData(obj['Location'])}</span></div>
                    <div class="stat-block"><span class="stat-label">Reward</span> <span class="stat-value">${formatData(obj['Reward'])}</span></div>
                    <div class="stat-block"><span class="stat-label" style="color: var(--text-muted);">Faction</span> <span class="stat-value" style="font-size: 1rem;">${formatData(obj['Faction Name'])}</span></div>
                </div>
            </div>`;
        });
    }
    objHtml += '</div>';
    document.getElementById("tab-objectives").innerHTML = objHtml;

    // 4. INDIVIDUALS TAB
    let indHtml = '<div class="entity-grid">';
    if (individuals.length === 0) {
        indHtml += "<p class='ghost-text' style='grid-column: 1 / -1;'>No notable individuals recorded.</p>";
    } else {
        individuals.forEach(ind => {
            indHtml += `
            <div class="field-note-card">
                <h3>${formatData(ind['Name'])}</h3>
                <span class="badge badge-danger">CR: ${formatData(ind['Challenge Rating'])}</span>
                <p class="entity-desc">${formatData(ind['Description'])}</p>
                <div class="entity-footer">
                    <div class="stat-block"><span class="stat-label">Strengths</span> <span class="stat-value">${formatData(ind['Strengths'])}</span></div>
                    <div class="stat-block"><span class="stat-label">Weaknesses</span> <span class="stat-value">${formatData(ind['Weaknesses'])}</span></div>
                    <div class="stat-block"><span class="stat-label">Allies</span> <span class="stat-value">${formatData(ind['Allies'])}</span></div>
                    <div class="stat-block"><span class="stat-label">Enemies</span> <span class="stat-value">${formatData(ind['Enemies'])}</span></div>
                    <div class="stat-block"><span class="stat-label" style="color: var(--text-muted);">Faction</span> <span class="stat-value" style="font-size: 1rem;">${formatData(ind['Faction Name'])}</span></div>
                </div>
            </div>`;
        });
    }
    indHtml += '</div>';
    document.getElementById("tab-individuals").innerHTML = indHtml;
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
    document.getElementById("champion-details").classList.add("hidden");
    document.getElementById("return-btn").classList.add("hidden");
    document.getElementById("champion-selection").classList.remove("hidden");
    document.getElementById("main-header").classList.remove("hidden");
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