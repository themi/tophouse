// // set the default config object
// var creds = new AWS.CognitoIdentityCredentials({
//  IdentityPoolId: 'ap-southeast-2:7ef20e3e-affb-48c3-8d6d-b1669c2f69ad'
// });
// AWS.config.credentials = creds;


// // Called when an identity provider has a token for a logged in user
// function userLoggedIn(providerName, token) {
//   creds.params.Logins = creds.params.Logins || {};
//   creds.params.Logins[providerName] = token;

//   // Expire credentials to refresh them on the next request
//   creds.expired = true;
// }


// ==========================================

// Ref: https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-integrating-user-pools-with-identity-pools.html

// var userPoolId = 'ap-southeast-2_AIgSOMayR';
// var clientId = '5nf7sd14o2d07ga8pfc341rqra';

// var poolData = {
//     UserPoolId: userPoolId,
//     ClientId: clientId
// };

// var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

// function login(username, password) {
//     var authenticationData = {
//         Username: username,
//         Password: password
//     };

//     var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

//     var userData = {
//         Username: username,
//         Pool: userPool
//     };

//     var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

//     console.log(cognitoUser);

//     cognitoUser.authenticateUser(authenticationDetails, {
//         onSuccess: function(result) {
//             var accessToken = result.getAccessToken().getJwtToken();
//             console.log('Authentication successful', accessToken);
//             window.location = './index.html';
//         },

//         onFailure: function(err) {
//             console.log('failed to authenticate');
//             console.log(JSON.stringify(err));
//             alert('Failed to Log in.\nPlease check your credentials.');
//         },
//     });
// }

// function checkLogin(redirectOnRec, redirectOnUnrec) {
//     var cognitoUser = userPool.getCurrentUser();
//     if (cognitoUser != null) {
//         if (redirectOnRec) {
//             window.location = './index.html';
//         } else {
//             $('#body').css({ 'visibility': 'visible' });
//         }
//     } else {
//         if (redirectOnUnrec) {
//             window.location = './signin.html';
//         }
//     }
// }

// function logOut() {
//     var cognitoUser = userPool.getCurrentUser();
//     console.log(cognitoUser, 'signing out...');
//     cognitoUser.signOut();
//     window.location = './signin.html';
// }
