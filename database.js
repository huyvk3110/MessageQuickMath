const admin = require('firebase-admin');
const serviceAccount = require('./quickmath-fac13-firebase-adminsdk-agotg-6d3a5bcecd.json');
const define = require('./define');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: define.FIREBASE_DB,
});

module.exports = admin.database();