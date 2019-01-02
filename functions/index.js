'use strict';

const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const dialogflow = require('dialogflow');

process.env.DEBUG = 'dialogflow:debug';

const cityData = {
  'New York': {
    trivia: {
      question: 'Which street in New York is famous for its musical theater?',
      answer: 'Broadway',
    },
    streets: [
      {value: 'Wall Street', synonyms: ['Wall Street']},
      {value: 'Fifth Avenue', synonyms: ['Fifth Avenue', '5th Avenue', '5th']},
      {value: 'Broadway', synonyms: ['Broadway']},
    ],
  },
  'Los Angeles': {
    trivia: {
      question: 'What street in Beverly Hills boasts some of ' + 'the most expensive shops in the world?',
      answer: 'Rodeo Drive',
    },
    streets: [
      {value: 'Rodeo Drive', synonyms: ['Rodeo Drive', 'Rodeo']},
      {value: 'Mulholland Drive', synonyms: ['Mulholland Drive', 'Mulholland']},
      {value: 'Hollywood Boulevard', synonyms: ['Hollywood Boulevard']},
    ],
  },
  'Chicago': {
    trivia: {
      question: `Which fashionable street did Chicago's first mayor live on?`,
      answer: 'Rush Street',
    },
    streets: [
      {value: 'Rush Street', synonyms: ['Rush Street', 'Rush']},
      {value: 'Lake Shore Drive', synonyms: ['Lake Shore Drive']},
      {value: 'Broadway', synonyms: ['Broadway']},
    ],
  },
  'Houston': {
    trivia: {
      question: 'What is the main street at the University of Houston?',
      answer: 'Cullen Boulevard',
    },
    streets: [
      {value: 'Cullen Boulevard', synonyms: ['Cullen Boulevard', 'Cullen']},
      {value: 'Kirby Drive', synonyms: ['Kirby Drive', 'Kirby']},
      {value: 'Westheimer Road', synonyms: ['Westheimer Road', 'Westheimer']},
    ],
  },
};

exports.dialogflowFirebaseFulfillment = 
  functions.https.onRequest((request, response) => {
    const agent = new WebhookClient({request, response});
    console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

    function askTriviaQuestion(agent) {
      const city = agent.parameters['city'];
      const data = cityData[city];
      const client = new dialogflow.SessionEntityTypesClient();
        const sessionEntityTypesName = agent.session + '/entityTypes/street';

        const sessionEntityType = {
          name: sessionEntityTypesName,
          entityOverrideMode: 'ENTITY_OVERRIDE_MODE_OVERRIDE',
          entities: data.streets,
        };
        
        const request = {
          parent: agent.session,
          sessionEntityType: sessionEntityType,
        };

        return client
          .createSessionEntityType(request)
          .then((responses) => {
            console.log('Successfully created session entity type: ', JSON.stringify(request));
            agent.add(`Great! I love ${city}. Here's a question about its streets!`);
            agent.add(data.trivia.question);
          })
          .catch((err) => {
            console.error('Error creating session entitytype: ', err);
            agent.add(`I'm sorry, I'm having trouble remembering that city.`);
            agent.add(`Is there a different city you'd like to be quizzed on?`);
          });
    }

    function checkTriviaAnswer(agent) {
      const context = agent.context.get('cityname-followup');
      const cityName = context.parameters ? context.parameters.city : undefined;

      if (!context || !cityName) {
        console.error('Expected context or parameter was not present');
        agent.add(`I'm sorry, I forgot which city we're talking about!`);
        agent.add(`Would you like me to ask you about New York, LA, Chicago, or Houston?`);
        return;
      }

      const streetName = agent.parameters['street'];

      const data = cityData[cityName];

      if (data.trivia.answer === streetName) {
        agent.add(`Nice work! You got the answer right. You're truly an expert on ${cityName}.`);
        agent.add(`Give me another city and I'll ask you more questions.`);
        agent.context.delete('cityname-followup');
      } else {
        agent.add(`Oops, ${streetName} isn't the right street! Try another street name ...`);
      }
    }

    const intentMap = new Map();
    intentMap.set('City name', askTriviaQuestion);
    intentMap.set('Trivia answer', checkTriviaAnswer);
    agent.handleRequest(intentMap);
  })