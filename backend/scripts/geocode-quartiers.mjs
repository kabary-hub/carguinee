/**
 * Récupère les coordonnées GPS de tous les quartiers de Conakry
 * Source : OpenStreetMap Nominatim API (gratuit, pas de clé API)
 */
import https from 'https';

const QUARTIERS = {
  KALOUM: [
    'Boulbinet', 'Almamya', 'Coronthie', 'Kaloum centre',
    'Kouléwondy', 'Manquepas', 'Sandervalia', 'Sans-fil',
    'Témitaye', 'Tombo'
  ],
  DIXINN: [
    'Belle-vue Dixinn', 'Camayenne', 'Cameroun Dixinn',
    'Dixinn cité', 'Dixinn gare', 'Dixinn mosquée',
    'Hafia Dixinn', 'Kénien', 'Landréah', 'Minière Dixinn'
  ],
  MATAM: [
    'Bonfi Conakry', 'Boussoura Matam', 'Carrière Matam',
    'Coléah Matam', 'Hermakonon', 'Lanseboundji',
    'Madina Matam', 'Mafanco', 'Matam centre', 'Touguiwondy'
  ],
  MATOTO: [
    'Simbaya Matoto', 'Matoto centre', 'Wanindara',
    'Sangoyah', 'Matoto Kabitaya', 'Kissosso'
  ],
  RATOMA: [
    'Taouyah', 'Kipé Conakry', 'Nongo Conakry',
    'Dar-es-salam Conakry', 'Hamdalaye Ratoma',
    'Kaporo Ratoma', 'Koloma Conakry', 'Ratoma centre',
    'Demoudoula', 'Bomboli', 'Soloprimo', 'Kakimbo'
  ]
};

function nominatimSearch(query) {
  return new Promise((resolve, reject) => {
    const q = encodeURIComponent(query + ', Conakry, Guinea');
    const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=gn`;
    https.get(url, { headers: { 'User-Agent': 'CarGuinee/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const results = JSON.parse(data);
          if (results.length > 0) {
            resolve({ lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon), display: results[0].display_name });
          } else {
            resolve(null);
          }
        } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const results = {};
  for (const [commune, quartiers] of Object.entries(QUARTIERS)) {
    results[commune] = {};
    for (const q of quartiers) {
      const coords = await nominatimSearch(q);
      if (coords) {
        results[commune][q] = { lat: coords.lat, lon: coords.lon };
        console.log(`✅ ${commune}/${q}: ${coords.lat}, ${coords.lon}`);
      } else {
        console.log(`❌ ${commune}/${q}: non trouvé`);
      }
      await sleep(1100); // Nominatim rate limit: 1 req/s
    }
  }
  
  // Output as JSON
  const fs = await import('fs');
  const outPath = new URL('../data/quartiers-coordinates.json', import.meta.url);
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log('\n📄 Fichier sauvegardé:', outPath.pathname);
}

main().catch(console.error);
