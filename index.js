// ===== RAILWAY NOTIFICATION SYSTEM - CODE COMPLET =====

const admin = require('firebase-admin');
const cron = require('node-cron');
const express = require('express');

// ===== CONFIGURATION FIREBASE =====
const serviceAccount = {
  type: "service_account",
  project_id: "buildtradeacademy",
  private_key_id: "ad65b003f982b49d1c895ec5acfe82415e9fdf86",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC+Pv4tLYDivq1C\nPdeJ1LpKgp3mN1096IVg1/hhTv3E2e6q/SLIaes7K0bU9Zi5Howb5SQ3c1AoJ1Nl\nok+tLe5Ywix0VuJc3nBx2h1tXOCZ53M/eJhfuvXumuSgxWDR0g5wHP1ipWRy0Y5Y\nXafkhG1A981VLR+1amhrfNVscu9EqMothV4tbwuVe/iHd7g+HSp/2sOtjzngpgSD\nQpjPUwqwTGIaCbW2mekdCsrJDDmBfo4MTr7hbL00d6pLU8dgGCg4npmxW6zMub42\nEhFYHEKY2F5iUP5WZ2Xz7aBcd6TTQwPVurssvwiHze9jk3T6w2v8UcfVUB1gPCav\na0XR+tY9AgMBAAECggEAJ7xviY8mCvYpqRrSoKrKiFKU2Wd59brR1QL3EZgWoB2m\n4JcDw1mANPkaj9OGZTAQsqjfMifHN8PTAvjubG0aCfbwoxIcsKoTUWxt1hBepza1\nFy5AoUojIQXAOCZRzTFzK46ajBagjuzfLuzM6wmP6lB31lEY/OLvUXge+cpd2HiN\n/n6g46t/7782ONBx4RE2tnyO+pHvxx0s5OCBpii+hvl7MvUKY+LizmnHMFORacGg\nBA4rh9ftRYLySTi+nT3Y3sJDrJjt2UIXS3w3TDoymcFCEF33zO9stpd+gi+YITPB\nLPWb5glxseVcya3leKrXRm20+szxyCABCR+9E2PuoQKBgQD4imuN+sFcLmM7PkRJ\nBvgorAbKJ1THgJvSrA+L8mm9uYTeeh/EPz10xmhjCAbiq7N+4ZsfQjbTW8UCun/W\nXB4WWfEzSQJtndJxmrw9zXXzrNO1T3kaKVQ49JZeRStogiu0c6Fgh/ujllTsgQJo\nRPv/ApZQUpt9PEYdkiaFj4tLcQKBgQDD9K9uGe28qF9i2k4n3iGnfm4uaSOiJeWO\nwnrKPAyuVx8lzt6hqFYJPwMtDmxFA/xq6iOztRoVPscZdOyX8sWZh+rDEYObgrnr\nE0d8cFreSoMIN4H2bk18PJ0PlVY8NVb2zEhfhaV3kFzEoDfp9fxj7Zq/7IWd8RPQ\ntQwn0YhZjQKBgEOwp1RW2/y4IYyMC9r7y/B/0aWTCrL/IvFArUdHMWdbtIVHK4mu\nU5WPR/TYxc9MRimjVjUwOnBcCQ8SLij6k7MwsdFu6/tgxWTtaKFIaPyBsHMr/uaS\nJP8SFjX8jrL66N5Ps77vqihGlECJbldpmlw8nyWnKfP0y3/YQyeTDbPxAoGAazKU\nNdshXy+M3vsl/lFaf9J+XA1QXQf2SN7DZZbsKQOoGnrM+Aqq5mv+RMu7FxZTI/nq\nhgjwt+ab7KU2OPmqd48PMp+GK7CcHKlzVfPxAeIpRHl5M2KsKObP1RKRFmbnqCOh\nBACMwJfM6BPuAqN66v+0xIGTpw+XE3m3qKDLwpECgYEA75JM+ACh0rTJK9MhG5Iq\n2cp/AQASF3uBjNWXqc/UC4zbmFkVR8+HeUcZux2IARHp7di8LrzUl/KiLQhafS03\n3JkotVMofFDGRWIW2M7BXOliSMhK2lx5nWkXytAVluTEkWDv0wnNOFXJIKRTJ20I\nKiVZ4DvciC3gHrHeTEspFnI=\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@buildtradeacademy.iam.gserviceaccount.com",
  client_id: "105898348592069461513",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40buildtradeacademy.iam.gserviceaccount.com"
};

// Initialiser Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://buildtradeacademy-default-rtdb.firebaseio.com"
});

const db = admin.firestore();
const messaging = admin.messaging();

// ===== CACHE DES NOTIFICATIONS ENVOYÉES =====
const sentNotifications = new Set();

// ===== RÉCUPÉRATION PRIX TEMPS RÉEL =====
async function getCurrentPrice(token) {
  try {
    const symbol = token + 'USDT'; // BTC → BTCUSDT
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error(`❌ Erreur prix ${token}:`, error);
    return null;
  }
}

// ===== FONCTION PRINCIPALE =====
async function checkTradingAlerts() {
  console.log('🔍 Vérification des alertes trading...', new Date().toISOString());
  
  try {
    // 1. Récupérer tous les utilisateurs avec trades ouverts
    const usersSnapshot = await db.collection('users').get();
    
    let totalUsers = 0;
    let totalOpenTrades = 0;
    let notificationsSent = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      // Vérifier s'il a un token FCM
      if (!userData.fcmToken) {
        continue;
      }
      
      // Vérifier s'il a des trades ouverts
      const openTrades = userData.tableau?.openTrades || [];
      if (openTrades.length === 0) {
        continue;
      }
      
      totalUsers++;
      totalOpenTrades += openTrades.length;
      
      console.log(`👤 User ${userData.profile?.name || userId}: ${openTrades.length} trades ouverts`);
      
      // 2. Vérifier chaque trade ouvert
      for (const trade of openTrades) {
        const alertSent = await checkTradeThresholds(trade, userData, userId);
        if (alertSent) notificationsSent++;
      }
    }
    
    console.log(`✅ Scan terminé: ${totalUsers} users, ${totalOpenTrades} trades, ${notificationsSent} notifications`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

// ===== VÉRIFICATION DES SEUILS =====
async function checkTradeThresholds(trade, userData, userId) {
  // 1. Récupérer prix actuel
  const currentPrice = await getCurrentPrice(trade.token);
  if (!currentPrice) return false;
  
  // 2. Calculer performance en temps réel
  const isLong = trade.position.includes('Long');
  const leverMultiplier = parseInt(trade.levier.replace('x', ''));
  const priceDiff = currentPrice - trade.prixOuv;
  
  let performance;
  if (isLong) {
    performance = (priceDiff / trade.prixOuv) * 100 * leverMultiplier;
  } else {
    performance = (-priceDiff / trade.prixOuv) * 100 * leverMultiplier;
  }
  
  console.log(`📊 ${trade.token}: ${trade.prixOuv} → ${currentPrice} = ${performance.toFixed(2)}%`);
  
  const tradeId = trade.id;
  let shouldNotify = false;
  let message = '';
  let priority = 'normal';
  let notifKey = '';

  // 🚀 PROFITS (+10%)
  if (performance >= 10) {
    notifKey = `${userId}_${tradeId}_profit_10`;
    if (!sentNotifications.has(notifKey)) {
      shouldNotify = true;
      message = `🚀 ${trade.token} : +${performance.toFixed(1)}% de profit !`;
      priority = 'normal';
    }
  }
  // 📉 PERTES LÉGÈRES (-10%)
  else if (performance <= -10 && performance > -20) {
    notifKey = `${userId}_${tradeId}_loss_10`;
    if (!sentNotifications.has(notifKey)) {
      shouldNotify = true;
      message = `📉 ${trade.token} : ${performance.toFixed(1)}% de perte`;
      priority = 'normal';
    }
  }
  // 🚨 PERTES IMPORTANTES (-20%)
  else if (performance <= -20 && performance > -50) {
    notifKey = `${userId}_${tradeId}_loss_20`;
    if (!sentNotifications.has(notifKey)) {
      shouldNotify = true;
      message = `🚨 ATTENTION ! ${trade.token} : ${performance.toFixed(1)}% de perte dangereuse !`;
      priority = 'high';
    }
  }
  // 💀 PERTES CRITIQUES (-50%)
  else if (performance <= -50) {
    notifKey = `${userId}_${tradeId}_loss_50`;
    if (!sentNotifications.has(notifKey)) {
      shouldNotify = true;
      message = `💀 ALERTE CRITIQUE ! ${trade.token} : ${performance.toFixed(1)}% - LIQUIDATION IMMINENTE !`;
      priority = 'critical';
    }
  }

  // Envoyer notification si nécessaire
  if (shouldNotify) {
    const sent = await sendFCMNotification(userData.fcmToken, trade, message, priority);
    if (sent) {
      sentNotifications.add(notifKey);
      console.log(`🔔 Notification envoyée: ${message}`);
      return true;
    }
  }
  
  return false;
}

// ===== ENVOI NOTIFICATION FCM =====
async function sendFCMNotification(fcmToken, trade, message, priority = 'normal') {
  try {
    const notificationData = {
      token: fcmToken,
      data: {
        tradeId: trade.id.toString(),
        token: trade.token,
        priority: priority,
        performance: trade.perfFlottante?.toString() || '0',
        timestamp: Date.now().toString(),
        requireInteraction: priority === 'critical' ? 'true' : 'false'
      },
      android: {
        priority: priority === 'critical' ? 'high' : 'normal',
        notification: {
          channel_id: 'trading_alerts',
          priority: priority === 'critical' ? 'high' : 'default',
          default_vibrate_timings: true
        }
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: '🚨 CryptoTraders Pro',
              body: message
            },
            badge: 1,
            sound: priority === 'critical' ? 'critical.wav' : 'default'
          }
        }
      },
      webpush: {
        notification: {
          title: '🚨 CryptoTraders Pro - ALERTE TRADING',
          body: message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `trading-${trade.id}`,
          requireInteraction: priority === 'critical',
          vibrate: priority === 'critical' ? [500, 200, 500, 200, 800] : [200, 100, 200]
        }
      }
    };
    
    const response = await messaging.send(notificationData);
    console.log('✅ Notification FCM envoyée:', response);
    return true;
    
  } catch (error) {
    console.error('❌ Erreur envoi FCM:', error);
    
    // Si token invalide, le supprimer de la base
    if (error.code === 'messaging/registration-token-not-registered') {
      console.log('🗑️ Token FCM invalide, suppression...');
      // Ici tu peux ajouter code pour supprimer le token invalide
    }
    
    return false;
  }
}

// ===== SERVEUR EXPRESS =====
const app = express();
app.use(express.json());

// Endpoint de test
app.get('/', (req, res) => {
  res.json({ 
    status: 'CryptoTraders Notification System Running',
    time: new Date().toISOString(),
    sentNotifications: sentNotifications.size
  });
});


app.post('/', async (req, res) => {
  try {
    console.log('📡 Test FCM reçu:', req.body);
    
    const { test, token, message } = req.body;
    
    if (test && token) {
      // Envoyer notification test
      const success = await sendFCMNotification(token, {
        id: 'test',
        token: 'TEST',
        perfFlottante: -25
      }, message || 'Test notification direct depuis mobile', 'critical');
      
      if (success) {
        res.json({ 
          status: 'success', 
          message: 'Notification test envoyée',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({ error: 'Erreur envoi FCM' });
      }
    } else {
      res.json({ 
        status: 'endpoint actif',
        message: 'Railway fonctionne',
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur endpoint test:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint de test manuel
app.post('/test-notifications', async (req, res) => {
  try {
    await checkTradingAlerts();
    res.json({ success: true, message: 'Test notifications terminé' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== CRON JOB =====
// Vérifier toutes les 1 minute
cron.schedule('* * * * *', () => {
  checkTradingAlerts();
});

// ===== DÉMARRAGE =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 CryptoTraders Notification System démarré sur le port ${PORT}`);
  console.log('⏰ Vérification des alertes toutes les 1 minute');
  
  // Test initial après 30 secondes
  setTimeout(() => {
    console.log('🧪 Test initial...');
    checkTradingAlerts();
  }, 30000);
});

// ===== GESTION ERREURS =====
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

console.log('✅ CryptoTraders Notification System chargé'); 
