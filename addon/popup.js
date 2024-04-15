let sessionId;
let instanceHostname;
let sfHost;
const sfApiVersion = '58.0';

document.addEventListener('DOMContentLoaded', function() {
  initExtension();
});

async function initExtension() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentTab = tabs[0];
    if (currentTab) {
      sfHost = new URL(currentTab.url).origin;
      retrieveSession(sfHost);
    }
  });

  document.getElementById('searchButton').addEventListener('click', searchHandler);
}

async function retrieveSession(host) {
  const message = await new Promise(resolve =>
    chrome.runtime.sendMessage({ message: "getSession", sfHost: host }, resolve)
  );
  if (message && message.key) {
    instanceHostname = getMyDomain(message.hostname);
    sessionId = message.key;
  } else {
    console.error("Failed to retrieve session ID");
  }
}

function searchHandler() {
  const objectName = document.getElementById('objectName').value;
  if (!objectName) {
    console.log("Object name is required.");
    return;
  }
  console.log(sfHost); // Debugging the Salesforce host
  try {
    queryCustomFields(objectName);
  } catch (error) {
    console.error('Error fetching data: ', error);
  }
}

function queryCustomFields(objectName) {
  const soqlQuery = `SELECT Id, DeveloperName, EntityDefinitionId, EntityDefinition.QualifiedApiName FROM CustomField WHERE EntityDefinition.QualifiedApiName = '${objectName}'`;
  const apiUrl = `https://${instanceHostname}/services/data/v${sfApiVersion}/tooling/query/?q=${encodeURIComponent(soqlQuery)}`;

  console.log("Making API request to:", apiUrl); // Debugging output to verify the URL

  fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${sessionId}`,
      'Accept': 'application/json; charset=UTF-8',
      'Content-Type': 'application/json; charset=UTF-8',
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log("API response data:", data);
    updateUIWithFields(data.records);
  })
  .catch(error => {
    console.error("Error making API request:", error);
  });
}

function updateUIWithFields(fields) {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';
  fields.forEach(field => {
    const p = document.createElement('p');
    p.textContent = `Field: ${field.DeveloperName} (Object Name: ${field.EntityDefinition.QualifiedApiName})`;
    resultsDiv.appendChild(p);
  });
}

function getMyDomain(host) {
  if (host) {
    return host.replace(/\.lightning\.force\./, ".my.salesforce.")
               .replace(/\.mcas\.ms$/, "");
  }
  return host;
}