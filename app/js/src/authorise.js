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
