'use strict';

const dialogflow = require('dialogflow');
const credentials = require('./credentials.json');

const entitiesClient = new dialogflow.EntityTypesClient({
  credentials: credentials,
});

const projectId = 'city-streets-trivia-a2d95';
const agentPath = entitiesClient.projectAgentPath(projectId);

const cityEntityType = {
  displayName: 'city',
  kind: 'KIND_MAP',
  entities: [
    {value: 'New York', synonyms: ['New York', 'NYC']},
    {value: 'Los Angeles', synonyms: ['Los Angeles', 'LA', 'L.A.']},
  ]
};

const cityRequest = {
  parent: agentPath,
  entityType: cityEntityType,
};

entitiesClient
  .createEntityType(cityRequest)
  .then((responses) => {
    console.log('Created New Entity Type:', JSON.stringify(responses[0]));

    const streetEntityType = {
      displayName: 'street',
      kind: 'KIND_MAP',
      entities: [
        {value: 'Broadway', synonyms: ['Broadway']},
      ]
    };

    const streetRequest = {
      parent: agentPath, 
      entityType: streetEntityType,
    };

    return entitiesClient.createEntityType(streetRequest);
  })
  .then((responses) => {
    console.log('Created new entity type: ', JSON.stringify(responses[0]));
  })
  .catch((err)=>{
    console.error('Error creating entity type: ', err);
  })

