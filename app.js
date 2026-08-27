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

function loadChampionData(championName, imageName) {
    document.getElementById("champion-selection").classList.add("hidden");
    document.getElementById("champion-details").classList.remove("hidden");
    
    document.getElementById("detail-title").innerText = championName;
    
    // Set the header image, with a fallback if missing
    const headerImg = document.getElementById("detail-header-image");
    headerImg.src = `assets/champion_art/${imageName}`;
    headerImg.onerror = function() {
        this.onerror = null;
        this.src = 'assets/champion_art/Placeholder_12.png';
    };
    
    // Using the exact CSV names from your repository
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
        document.getElementById("tab-faction").innerHTML = `<p style="color:var(--xeryos-crimson-bright); font-weight:bold;">Error loading data. If you are opening this locally from your desktop, your browser is blocking CSV access. Please view via GitHub Pages or a local web server.</p>`;
    });
}

function populateTabs(faction, subFactions, objectives, individuals, championName) {
    // Dynamically calculate the leader image path based on the champion name
    const formattedName = championName.replace(/\s+/g, '_');
    const leaderImg = `assets/leader_art/${formattedName}_Leader.png`;

    // 1. Faction Dashboard (All fields restored)
    document.getElementById("tab-faction").innerHTML = `
        <div class="faction-hero">
            <h3>${faction['Faction Name'] || 'Unknown Faction'}</h3>
            <p class="faction-desc">${faction['Faction Description'] || 'No official description registered.'}</p>
        </div>
        
        <div class="leader-profile-bar">
            <img src="${leaderImg}" alt="Leader Art" class="leader-avatar" onerror="this.onerror=null; this.src='assets/champion_art/Placeholder_12.png';">
            <div class="leader-info">
                <span class="stat-label">Faction Leader</span>
                <span class="stat-value">${faction['Leader Name'] || 'Unknown'} 
                    <span class="danger-text" style="font-size:0.9rem; margin-left:8px;">(Danger: ${faction['Leader Danger'] || 'Unknown'})</span>
                </span>
            </div>
            <div class="stat-box">
                <span class="stat-label">Combat Style</span>
                <span class="stat-value">${faction['Combat Style'] || 'Variable'}</span>
            </div>
            <div class="stat-box">
                <span class="stat-label">Force Size</span>
                <span class="stat-value">${faction['Size of Forces'] || 'Unknown'}</span>
            </div>
            <div class="stat-box">
                <span class="stat-label">Overall Danger</span>
                <span class="stat-value highlight">${faction['Overall Danger Level'] || 'Unknown'}</span>
            </div>
        </div>

        <div class="info-grid">
            <div class="info-panel">
                <h4>Logistics & Structure</h4>
                <div class="detail-item"><strong>HQ Location:</strong> ${faction['HQ Location'] || 'Classified'}</div>
                <div class="detail-item"><strong>HQ Details:</strong> ${faction['HQ Description'] || 'N/A'}</div>
                <div class="detail-item"><strong>HQ Danger:</strong> <span class="danger-text">${faction['HQ Danger Level'] || 'N/A'}</span></div>
                <div class="detail-item"><strong>HQ Features:</strong> ${faction['HQ Features'] || 'N/A'}</div>
                <div class="detail-item"><strong>HQ Accessibility:</strong> ${faction['HQ Accessibility'] || 'N/A'}</div>
            </div>
            <div class="info-panel">
                <h4>Alignments & Doctrine</h4>
                <div class="detail-item"><strong>Unique Abilities:</strong> ${faction['Unique Abilities'] || 'None logged'}</div>
                <div class="detail-item"><strong>Strengths:</strong> ${faction['Strengths'] || 'Unknown'}</div>
                <div class="detail-item"><strong>Weaknesses:</strong> ${faction['Weaknesses'] || 'Unknown'}</div>
                <div class="detail-item"><strong>Likes / Dislikes:</strong> ${faction['Likes'] || 'N/A'} / ${faction['Dislikes'] || 'N/A'}</div>
                <div class="detail-item"><strong>Interests:</strong> ${faction['Interests'] || 'N/A'}</div>
                <div class="detail-item"><strong>Alliances:</strong> ${faction['Alliances'] || 'None'}</div>
                <div class="detail-item"><strong>Enemies:</strong> ${faction['Enemies'] || 'None'}</div>
            </div>
        </div>
    `;

    // 2. Sub-Factions
    let subHtml = "";
    if (subFactions.length === 0) {
        subHtml = "<p>No sub-factions recorded.</p>";
    } else {
        subFactions.forEach(sub => {
            subHtml += `
            <div class="entity-card">
                <div class="entity-header">
                    <h3>${sub['Faction Name']}</h3>
                    <span class="badge badge-danger">${sub['Overall Danger Level']} Danger</span>
                </div>
                <p class="entity-desc">${sub['Description'] || 'No description provided.'}</p>
                <div class="entity-footer">
                    <span><strong>Leader:</strong> ${sub['Leader Name']}</span>
                    <span><strong>Force Size:</strong> ${sub['Size of Forces']}</span>
                    <span><strong>Alliances:</strong> ${sub['Alliances']}</span>
                </div>
            </div>`;
        });
    }
    document.getElementById("tab-subfactions").innerHTML = subHtml;

    // 3. Objectives
    let objHtml = "";
    if (objectives.length === 0) {
        objHtml = "<p>No active objectives recorded.</p>";
    } else {
        objectives.forEach(obj => {
            let statusBadge = obj['Status'] === 'Ongoing' ? 'badge-highlight' : 'badge-neutral';
            objHtml += `
            <div class="entity-card">
                <div class="entity-header">
                    <h3>${obj['Objective Name']}</h3>
                    <div>
                        <span class="badge ${statusBadge}">${obj['Status']}</span>
                    </div>
                </div>
                <p class="entity-desc">${obj['Description'] || 'No description provided.'}</p>
                <div class="entity-footer">
                    <span><strong>Difficulty:</strong> ${obj['Difficulty']}</span>
                    <span><strong>Location:</strong> ${obj['Location']}</span>
                    <span><strong>Reward:</strong> ${obj['Reward']}</span>
                    <span><strong>Faction:</strong> ${obj['Faction Name']}</span>
                </div>
            </div>`;
        });
    }
    document.getElementById("tab-objectives").innerHTML = objHtml;

    // 4. Individuals
    let indHtml = "";
    if (individuals.length === 0) {
        indHtml = "<p>No notable individuals recorded.</p>";
    } else {
        individuals.forEach(ind => {
            indHtml += `
            <div class="entity-card">
                <div class="entity-header">
                    <h3>${ind['Name']}</h3>
                    <span class="badge badge-danger">CR: ${ind['Challenge Rating']}</span>
                </div>
                <p class="entity-desc">${ind['Description'] || 'No profile available.'}</p>
                <div class="entity-footer">
                    <span><strong>Strengths:</strong> ${ind['Strengths']}</span>
                    <span><strong>Weaknesses:</strong> ${ind['Weaknesses']}</span>
                    <span><strong>Assoc. Faction:</strong> ${ind['Faction Name']}</span>
                </div>
            </div>`;
        });
    }
    document.getElementById("tab-individuals").innerHTML = indHtml;
}

function openTab(evt, tabId) {
    const tabContents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove("active");
    }
    
    const tabLinks = document.getElementsByClassName("tab-link");
    for (let i = 0; i < tabLinks.length; i++) {
        tabLinks[i].classList.remove("active");
    }
    
    document.getElementById(tabId).classList.add("active");
    evt.currentTarget.classList.add("active");
}

function returnToGrid() {
    document.getElementById("champion-details").classList.add("hidden");
    document.getElementById("champion-selection").classList.remove("hidden");
}