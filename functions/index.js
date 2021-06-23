const functions = require("firebase-functions");
const admin = require("firebase-admin");
const firebaseTools = require("firebase-tools");
admin.initializeApp();

exports.sendGameRequest = functions.firestore
    .document("gameRequests/{requestSenderId}")
    .onCreate((docSnapshot, context) => {
      const request = docSnapshot.data();
      const senderNicknameFromDoc = request["senderNickname"];
      const senderUserIdFromDoc = request["senderUserId"];
      const recipientNicknameFromDoc = request["recipientNickname"];
      const recipientTokenFromDoc = request["recipientToken"];
      const payload = {
        data: {
          senderNickname: senderNicknameFromDoc,
          senderUserId: senderUserIdFromDoc,
          recipientNickname: recipientNicknameFromDoc,
        },
      };

      return admin.messaging().sendToDevice(recipientTokenFromDoc, payload);
    });


/**
 * Initiate a recursive delete of documents at a given path.
 *
 * The calling user must be authenticated and have the custom "admin" attribute
 * set to true on the auth token.
 *
 * This delete is NOT an atomic operation and it's possible
 * that it may fail after only deleting some documents.
 *
 * @param {string} data.path the document or collection path to delete.
 */
exports.recursiveDelete = functions
    .runWith({
      timeoutSeconds: 540,
      memory: "2GB",
    })
    .https.onCall(async (data, context) => {
      const path = data.path;
      console.log(
          `User ${context.auth.uid} has requested to delete path ${path}`
      );

      // Run a recursive delete on the given document or collection path.
      // The 'token' must be set in the functions config, and can be generated
      // at the command line by running 'firebase login:ci'.
      await firebaseTools.firestore
          .delete(path, {
            project: process.env.GCLOUD_PROJECT,
            recursive: true,
            yes: true,
            token: functions.config().fb.token,
          });

      return {
        path: path,
      };
    });
