document.addEventListener('DOMContentLoaded', () => {
    let currentDate = new Date();

    // Function to format the date
    function formatDate(date) {
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        return new Intl.DateTimeFormat('en-US', options).format(date);
    }

    // Set current Gregorian and Islamic dates in the Prayer Schedule
    // Set current Gregorian and Islamic dates in the Prayer Schedule
async function setCurrentDate() {
    const currentDateElement = document.getElementById('current-day');
    const islamicDateElement = document.getElementById('islamic-date');
    
    // Set Gregorian Date
    currentDateElement.textContent = formatDate(currentDate);

    // Fetch Islamic Date from AlAdhan API
    const url = `https://api.aladhan.com/v1/gToH?date=${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data && data.data && data.data.hijri && data.data.hijri.date) {
            const hijriDate = data.data.hijri;
            islamicDateElement.textContent = `Hijri Date: ${hijriDate.day} ${hijriDate.month.en}, ${hijriDate.year}`;
        } else {
            islamicDateElement.textContent = 'Unable to fetch Islamic date';
            console.error('Islamic date data not available in the response:', data);
        }
    } catch (error) {
        console.error('Error fetching the Islamic date:', error);
        islamicDateElement.textContent = 'Error fetching Islamic date';
    }
}


    // Function to fetch Suhoor, Sunrise, Sunset, and Iftar from AlAdhan API
    async function fetchAdditionalTimesFromAPI() {
        const url = `https://api.aladhan.com/v1/timingsByCity?city=Paisley&country=United%20Kingdom&method=2`;
        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data && data.data && data.data.timings) {
                const timings = data.data.timings;

                // Update Suhur (Fajr), Sunrise, Sunset, Iftar (Maghrib)
                // document.getElementById('suhur-time').textContent = timings.Fajr;  // Suhur time is Fajr
                // document.getElementById('sunrise-time').textContent = timings.Sunrise;  // Sunrise time
                // document.getElementById('sunset-time').textContent = timings.Sunset;  // Sunset time
                // document.getElementById('iftar-time').textContent = timings.Maghrib;  // Iftar time is Maghrib
            } else {
                console.error('No prayer timings available from API.');
            }
        } catch (error) {
            console.error('Error fetching additional prayer times from API:', error);
        }
    }

    // Function to fetch prayer times from the JSON file
    async function fetchPrayerTimes() {
        const day = currentDate.getDate();
        const month = currentDate.getMonth() + 1; // Months are 0-indexed in JS, so add 1

        try {
            // Fetch the JSON file that contains the prayer times
            const response = await fetch('./prayer_timing.json');  // Update this to the actual path of the JSON file
            const data = await response.json();

            // Get the current month's prayer times
            const monthData = data[`Month_${month}`];

            if (monthData) {
                // Find today's prayer times in the month's data
                const prayerTimes = monthData.find(entry => entry.DATE == day);

                if (prayerTimes) {
                    // Update the prayer times in the table
                    document.getElementById('suhur-time').textContent = prayerTimes.Fajr;  // Suhur time is Fajr
                    document.getElementById('iftar-time').textContent = prayerTimes.Maghrib;  // Iftar time is Maghrib
                    document.getElementById('sunrise-time').textContent = prayerTimes['Sunrise'];  // Sunrise time
                    document.getElementById('sunset-time').textContent = prayerTimes.Maghrib;  // Sunset time
                    document.getElementById('fajr-time').textContent = prayerTimes.Fajr;
                    document.getElementById('fajr-iqamah').textContent = prayerTimes['Fajr_iqama'];
                    document.getElementById('dhuhr-time').textContent = prayerTimes.Duhar;
                    document.getElementById('dhuhr-iqamah').textContent = prayerTimes['Duhar_iqama'];
                    document.getElementById('asr-time').textContent = prayerTimes.Asr;
                    document.getElementById('asr-iqamah').textContent = prayerTimes['Asr_iqama'];
                    document.getElementById('maghrib-time').textContent = prayerTimes.Maghrib;
                    document.getElementById('maghrib-iqamah').textContent = prayerTimes['Maghrib_iqama'];
                    document.getElementById('isha-time').textContent = prayerTimes.Isha;
                    document.getElementById('isha-iqamah').textContent = prayerTimes['Isha_iqama'];

                    // Jumu'ah handling
                    document.getElementById('jumuah-time').textContent = prayerTimes.Jumuah || '01:17 PM';  // Default time if not present
                    document.getElementById('jumuah-iqamah').textContent = prayerTimes['Jumuah_iqama'] || '02:00 PM'; // Default time if not present

                    // Set next prayer dynamically
                    setNextIqamah(prayerTimes);
                } else {
                    console.error('No prayer time data found for today.');
                }
            } else {
                console.error('No prayer time data available for this month.');
            }
        } catch (error) {
            console.error('Error fetching prayer times from JSON:', error);
        }
    }

    // Function to dynamically set the next Iqamah time
function setNextIqamah(prayerTimes) {
    const currentHour = new Date().getHours();
    const currentMinutes = new Date().getMinutes();
    const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;

    const prayerSchedule = [
        { name: 'Fajr', time: prayerTimes['Fajr_iqama'] },
        { name: 'Dhuhr', time: prayerTimes['Duhar_iqama'] },
        { name: 'Asr', time: prayerTimes['Asr_iqama'] },
        { name: 'Maghrib', time: prayerTimes['Maghrib_iqama'] },
        { name: 'Isha', time: prayerTimes['Isha_iqama'] }
    ];

    // Convert current time and prayer times to minutes for easy comparison
    function timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    const currentTimeInMinutes = timeToMinutes(currentTime);

    // Find the next prayer by comparing times in minutes
    let nextPrayer = null;
    for (const prayer of prayerSchedule) {
        const prayerTimeInMinutes = timeToMinutes(prayer.time);
        if (prayerTimeInMinutes > currentTimeInMinutes) {
            nextPrayer = prayer;
            break;
        }
    }

    // If no upcoming prayer found (past Isha), set Fajr as next (for the next day)
    if (!nextPrayer) {
        nextPrayer = prayerSchedule[0];
    }

    // Update the next Iqamah details in the DOM
    document.getElementById('next-prayer-name').textContent = nextPrayer.name;
    document.getElementById('next-prayer-time').textContent = nextPrayer.time;
}

    // Function to update the prayer times and dates when the Next or Previous button is clicked
    function updateDateAndPrayerTimes() {
        // Set the current date
        setCurrentDate();
        // Fetch new prayer times
        fetchPrayerTimes();
        // Fetch additional times (Suhur, Sunrise, Sunset, Iftar)
        fetchAdditionalTimesFromAPI();
    }

    // Event listener for Previous button
    document.getElementById('prev-date').addEventListener('click', function () {
        currentDate.setDate(currentDate.getDate() - 1); // Subtract one day
        updateDateAndPrayerTimes();
    });

    // Event listener for Next button
    document.getElementById('next-date').addEventListener('click', function () {
        currentDate.setDate(currentDate.getDate() + 1); // Add one day
        updateDateAndPrayerTimes();
    });

    // Function to fetch verse of the day from the API
    async function fetchVerseOfTheDay() {
        const totalVerses = 6236; // Total number of verses in the Quran
        const dayOfYear = Math.floor((currentDate - new Date(currentDate.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        const verseId = (dayOfYear % totalVerses) + 1;
        const apiUrl = `http://api.alquran.cloud/v1/ayah/${verseId}/editions/quran-simple,en.asad`;

        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
    
            if (data && data.data) {
                const arabicText = data.data[0].text;
                const englishText = data.data[1].text;
                const verseReference = `${data.data[1].surah.englishName} ${data.data[1].numberInSurah}`;
                document.getElementById('verse-text').innerHTML = `
                    <p style="font-size: 1.5em; text-align: right;">${arabicText}</p>
                    <p>“${englishText}”</p>
                    <footer>- Quran ${verseReference}</footer>
                `;
            } else {
                document.getElementById('verse-text').innerHTML = `<p>No verse data available.</p>`;
            }
        } catch (error)        {
            console.error('Error fetching the verse:', error);
            document.getElementById('verse-text').innerHTML = `<p>Unable to fetch verse at this time.</p>`;
        }
    }

    async function fetchHadithOfTheDay() {
        const apiUrl = 'https://www.hadithapi.com/api/hadiths';
        const apiKey = '$2y$10$KonqlggmiZXaEDC3W4NO6OSKJFHStx5gGhg6OyiVdsLtwb3M62m';  // Your API key here
    
        try {
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,  // Pass the API key in the Authorization header
                    'Content-Type': 'application/json'
                }
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
            }
    
            const data = await response.json();
            console.log('API Response:', data);  // Log the entire API response to see the structure
    
            if (data && Array.isArray(data.data) && data.data.length > 0) {  // Adjust based on the response structure
                const randomIndex = Math.floor(Math.random() * data.data.length);
                const randomHadith = data.data[randomIndex];
    
                localStorage.setItem('lastFetchedDate', new Date().toDateString());
                localStorage.setItem('cachedHadith', JSON.stringify(randomHadith));
    
                displayHadith(randomHadith);
            } else {
                document.getElementById('hadith-text').innerHTML = `<p>No hadith data available.</p>`;
            }
        } catch (error) {
            console.error('Error fetching the Hadith:', error);
            document.getElementById('hadith-text').innerHTML = `<p>Do not have ill-will towards one another, do not be envious of one another, do not turn your back on one another; O, servants of Allah, be brothers (and sisters). It is not permissible for a Muslim to remain angry with their brother [in religion] for more than three days.[Bukhari, Al-Adab (Good Manners); 57-58]</p>`;
        }
    }
    
    function displayHadith(hadith) {
        // Adjust field names based on the actual response structure
        const hadithText = hadith.hadith || 'No Hadith text available';  // Example field names
        const translation = hadith.translation || 'No translation available';  // Adjust if necessary
        const bookName = hadith.book || 'Unknown book';
        const hadithNumber = hadith.hadith_number || 'Unknown number';  // Adjust if necessary
    
        document.getElementById('hadith-text').innerHTML = `
            <p>“${hadithText}”</p>
            <p><strong>Translation:</strong> ${translation}</p>
            <footer>- Book: ${bookName}, Hadith No: ${hadithNumber}</footer>
        `;
    }
    
    
    
    
    
    

    // Initialize the page with the current date, prayer times, and hadith/verse of the day
    setCurrentDate();
    fetchPrayerTimes();
    fetchAdditionalTimesFromAPI();  // Fetch Suhur, Sunrise, Sunset, Iftar from API
    fetchVerseOfTheDay();
    fetchHadithOfTheDay();

    // Initial call to set the current date and prayer times
    updateDateAndPrayerTimes();
});

