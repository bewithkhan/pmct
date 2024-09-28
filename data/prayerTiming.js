document.addEventListener('DOMContentLoaded', () => {
    let currentDate = new Date();

    // Function to format the date
    function formatDate(date) {
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        return new Intl.DateTimeFormat('en-US', options).format(date);
    }

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
    // async function fetchAdditionalTimesFromAPI() {
    //     const url = `https://api.aladhan.com/v1/timingsByCity?city=Paisley&country=United%20Kingdom&method=2`;
    //     try {
    //         const response = await fetch(url);
    //         const data = await response.json();

    //         if (data && data.data && data.data.timings) {
    //             document.getElementById('sunrise-time').textContent = data.data.timings.Sunrise;
    //             document.getElementById('sunset-time').textContent = data.data.timings.Sunset;
    //         } else {
    //             console.error('No prayer timings available from API.');
    //         }
    //     } catch (error) {
    //         console.error('Error fetching additional prayer times from API:', error);
    //     }
    // }

    // Function to format and append AM/PM to prayer times
    function formatTimeWithAmPm(prayerTimes) {
        prayerTimes.Fajr += " AM";
        prayerTimes.Fajr_iqama += " AM";
        prayerTimes.Sunrise += " AM";
        prayerTimes.Dhuhr += " PM";
        prayerTimes.Dhuhr_iqama += " PM";
        prayerTimes.Asr += " PM";
        prayerTimes.Asr_iqama += " PM";
        prayerTimes.Maghrib += " PM";
        prayerTimes.Maghrib_iqama += " PM";
        prayerTimes.Isha += " PM";
        prayerTimes.Isha_iqama += " PM";
    }

    // Function to fetch prayer times from the JSON file
    async function fetchPrayerTimes() {
        const currentDate = new Date();
        const currentDay = currentDate.getDate();
        const currentMonth = currentDate.toLocaleString('default', { month: 'long' }); // Get current month in full text
        
        try {
            const response = await fetch('/data/prayer_timing.json'); // Path to your JSON file
            const data = await response.json();
            const monthData = data[`Month_${currentMonth}`]; // Access the month data

            if (monthData) {
                const prayerTimes = monthData.find(entry => entry.DATE === currentDay);

                if (prayerTimes) {
                    formatTimeWithAmPm(prayerTimes); // Append AM/PM to the relevant timings

                    // Update the HTML elements with the fetched prayer times
                    document.getElementById('sunrise-time').textContent = prayerTimes.Sunrise;
                    document.getElementById('sunset-time').textContent = prayerTimes.Maghrib; //maghrib is sunset timing
                    document.getElementById('fajr-time').textContent = prayerTimes.Fajr;
                    document.getElementById('fajr-iqamah').textContent = prayerTimes.Fajr_iqama;
                    document.getElementById('sunrise-time').textContent = prayerTimes.Sunrise;
                    document.getElementById('dhuhr-time').textContent = prayerTimes.Dhuhr;
                    document.getElementById('dhuhr-iqamah').textContent = prayerTimes.Dhuhr_iqama;
                    document.getElementById('asr-time').textContent = prayerTimes.Asr;
                    document.getElementById('asr-iqamah').textContent = prayerTimes.Asr_iqama;
                    document.getElementById('maghrib-time').textContent = prayerTimes.Maghrib;
                    document.getElementById('maghrib-iqamah').textContent = prayerTimes.Maghrib_iqama;
                    document.getElementById('isha-time').textContent = prayerTimes.Isha;
                    document.getElementById('isha-iqamah').textContent = prayerTimes.Isha_iqama;
                    
                    // Jumu'ah handling
                    // Jumu'ah handling - Set default times if not present
                    document.getElementById('jumuah-time').textContent = prayerTimes.Jumuah || '01:17 PM';  // Default Jumu'ah time if not in JSON
                    document.getElementById('jumuah-iqamah').textContent = prayerTimes.Jumuah_iqama || '02:30 PM';  // Default Jumu'ah Iqamah time if not in JSON
                } else {
                    console.error('No prayer times found for today.');
                }
            } else {
                console.error('No data available for this month.');
            }
        } catch (error) {
            console.error('Error fetching prayer times:', error);
        }
    }

    // Function to dynamically set the next Iqamah time
    function setNextIqamah(prayerTimes) {
        const currentHour = new Date().getHours();
        const currentMinutes = new Date().getMinutes();
        const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;

        function timeToMinutes(time) {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        }

        const currentTimeInMinutes = timeToMinutes(currentTime);

        let nextPrayer = null;
        for (const prayer of prayerTimes) {
            const prayerTimeInMinutes = timeToMinutes(prayer.time);
            if (prayerTimeInMinutes > currentTimeInMinutes) {
                nextPrayer = prayer;
                break;
            }
        }

        if (!nextPrayer) {
            nextPrayer = prayerTimes[0];
        }

        document.getElementById('next-prayer-name').textContent = nextPrayer.name;
        document.getElementById('next-prayer-time').textContent = nextPrayer.time;
    }

    // Update the prayer times and dates when the Next or Previous button is clicked
    function updateDateAndPrayerTimes() {
        setCurrentDate();
        fetchPrayerTimes();
        //fetchAdditionalTimesFromAPI();
    }

    // Event listener for Previous button
    document.getElementById('prev-date').addEventListener('click', function () {
        currentDate.setDate(currentDate.getDate() - 1);
        updateDateAndPrayerTimes();
    });

    // Event listener for Next button
    document.getElementById('next-date').addEventListener('click', function () {
        currentDate.setDate(currentDate.getDate() + 1);
        updateDateAndPrayerTimes();
    });

    // Fetch the verse of the day from the API
    async function fetchVerseOfTheDay() {
        const totalVerses = 6236;
        const dayOfYear = Math.floor((currentDate - new Date(currentDate.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        const verseId = (dayOfYear % totalVerses) + 1;
        const apiUrl = `https://api.alquran.cloud/v1/ayah/${verseId}/editions/quran-simple,en.asad`;

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
        } catch (error) {
            console.error('Error fetching the verse:', error);
            document.getElementById('verse-text').innerHTML = `<p>Unable to fetch verse at this time.</p>`;
        }
    }

    // Fetch the hadith of the day from the API
    async function fetchHadithOfTheDay() {
        const apiUrl = 'https://www.hadithapi.com/api/hadiths';
        const apiKey = 'Your_API_Key_Here'; // Insert your actual API key

        try {
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            if (data && Array.isArray(data.data) && data.data.length > 0) {
                const randomHadith = data.data[Math.floor(Math.random() * data.data.length)];
                displayHadith(randomHadith);
            } else {
                document.getElementById('hadith-text').innerHTML = `<p>No hadith data available.</p>`;
            }
        } catch (error) {
            console.error('Error fetching the hadith:', error);
            document.getElementById('hadith-text').innerHTML = `<p> Do not have ill-will towards one another, do not be envious of one another, do not turn your back on one another; O, servants of Allah, be brothers (and sisters). It is not permissible for a Muslim to remain angry with their brother [in religion] for more than three days.[Bukhari, Al-Adab (Good Manners); 57-58]</p>`;
        }
    }

    function displayHadith(hadith) {
        const hadithText = hadith.hadith || 'No Hadith text available';
        const translation = hadith.translation || 'No translation available';
        const bookName = hadith.book || 'Unknown book';
        const hadithNumber = hadith.hadith_number || 'Unknown number';

        document.getElementById('hadith-text').innerHTML = `
            <p>“${hadithText}”</p>
            <p><strong>Translation:</strong> ${translation}</p>
            <footer>- Book: ${bookName}, Hadith No: ${hadithNumber}</footer>
        `;
    }

    // Initialize the page
    setCurrentDate();
    fetchPrayerTimes();
    //fetchAdditionalTimesFromAPI();
    fetchVerseOfTheDay();
    fetchHadithOfTheDay();

    updateDateAndPrayerTimes();
    
    // Event listeners for Previous and Next buttons
    document.getElementById('prev-date').addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 1);
        updateDateAndPrayerTimes();
    });

    document.getElementById('next-date').addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 1);
        updateDateAndPrayerTimes();
    });
});
