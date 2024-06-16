document.addEventListener('DOMContentLoaded', function() {
    // Make an API call to increment the visit count
    fetch('https://a29kvwav41.execute-api.us-west-2.amazonaws.com/prod/incrementCounter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
    })
    .then(response => response.json())
    .then(data => {
      console.log('Visit count incremented:', data);
    })
    .catch(error => {
      console.error('Error incrementing visit count:', error);
    });
  
    // Make an API call to get the current visit count
    fetch('https://a29kvwav41.execute-api.us-west-2.amazonaws.com/prod/getCounter')
    .then(response => response.json())
    .then(data => {
        console.log(data)
      const visitCount = data;
      document.getElementById('visit-count').textContent = visitCount;
    })
    .catch(error => {
      console.error('Error fetching visit count:', error);
      document.getElementById('visit-count').textContent = 'Error Loading';
    });
  });
  