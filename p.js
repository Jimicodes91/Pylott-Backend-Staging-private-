const axios = require("axios");

const i = axios.create({
	baseURL: 'https://api.cal.com/v2',
	headers: {
		'Content-Type': 'application/json',
		'Authorization': `Bearer cal_live_8b95ce3f25d1973d954ffa1d2ad0157d`,
	},
});

(async () => {
  const response = await i.get('/event-types');
  // const eventTypes = response.data.event_types;
  console.log(response.data.data.eventTypeGroups[0].eventTypes);
})()