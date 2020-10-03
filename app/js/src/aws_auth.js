// Initialize the Amazon Cognito credentials provider
// and default to the UnAuthorised Role
AWS.config.region = 'ap-southeast-2'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'ap-southeast-2:7ef20e3e-affb-48c3-8d6d-b1669c2f69ad',
});


// // Called when an identity provider has a token for a logged in user
// function userLoggedIn(providerName, token) {
//   AWS.config.credentials.params.Logins = creds.params.Logins || {};
//   AWS.config.credentials.params.Logins[providerName] = token;

//   // Expire credentials to refresh them on the next request
//   AWS.config.credentials.expired = true;
// }



// var authenticationData = {
//         Username : 'username',
//         Password : 'password',
//     };
//     var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
//     var poolData = { UserPoolId : 'us-east-1_ExaMPle',
//         ClientId : '1example23456789'
//     };
//     var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
//     var userData = {
//         Username : 'username',
//         Pool : userPool
//     };
//     var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
//     cognitoUser.authenticateUser(authenticationDetails, {
//         onSuccess: function (result) {
//             var accessToken = result.getAccessToken().getJwtToken();

//             /* Use the idToken for Logins Map when Federating User Pools with identity pools or when passing through an Authorization Header to an API Gateway Authorizer */
//             var idToken = result.idToken.jwtToken;
//         },

//         onFailure: function(err) {
//             alert(err);
//         },

// });
