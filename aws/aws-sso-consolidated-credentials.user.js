// ==UserScript==
// @name         AWS SSO Consolidated Credentials
// @namespace    https://github.com/erosen03
// @version      2.0
// @description  Collect all AWS SSO temporary credentials into a credential file format
// @author       erosen03
// @icon         https://www.google.com/s2/favicons?sz=64&domain=aws.amazon.com
// @grant        none
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @require      https://code.jquery.com/ui/1.13.1/jquery-ui.min.js
// @match        https://*.awsapps.com/start*
// ==/UserScript==

'use strict';
console.log(window.jQuery);
console.log($);

$(document).ready(function() {
    console.log("AWS SSO Consolidated Credentials script starting");

    // wait 2 seconds
    console.log("Waiting 2 seconds to proceed...");
    const myTimeout = setTimeout(setupUI, 2000);
});

function setupUI(){
    // load jquery ui stylesheet
    $("<link/>", {
        rel: "stylesheet",
        type: "text/css",
        href: "https://code.jquery.com/ui/1.13.1/themes/humanity/jquery-ui.css"
    }).appendTo("head");

    $(".service-links").prepend(`
    <img style="max-width:18px; margin-right:5px;" src="https://www.owcer.com/wp-content/uploads/2017/03/cropped-owcerl-logo-symbol-32x32.png?x95473"</img>
    <a id="getAllCredentials" _ngcontent-c2>
            <span _ngcontent-c2>Get all credentials</span>
        </a>
    <div _ngcontent-c2 class="divider"></div>
    `);
    // wire up the click event
    $("a#getAllCredentials").click(function() {
        getCredentials();
        return false;
    });

    // define the credentials dialog box
    $("body").append(`
    <div id="dialog-form" title="Temporary Credentials">
    <textarea readonly id="taTemporaryCredentials" name="taTemporaryCredentials" rows="30" cols="100"></textarea>
    </div>
    `);

    var credentialsDialog = $( "#dialog-form" ).dialog({
        autoOpen: false,
        width: 600,
        modal: true,
        buttons: {
            Close: function() {
                // close the dialog
                $( this ).dialog( "close" );
            },
            "Copy credentials and close": function() {
                // select the credentials
                $( this ).find("#taTemporaryCredentials").select();

                // copy credentials the clipboard
                document.execCommand("copy");

                // close the dialog
                $( this ).dialog( "close" );
            }
        }
    });

}

function getCredentials(){
    // define some friendly names for credential profiles
    var credentialProfileFriendlyNames = {
        "593773635496_Cloud_Administrator": "Forensics_593773635496_Cloud_Administrator",
        "443508441113_Cloud_Administrator": "AARP-CODE-COMMIT",
        "544284589722_Cloud_Administrator": "AARP-OPS-DEV-2",
        "565161773908_Cloud_Administrator": "AARP-AAI-DEV",
        "598885646065_Cloud_Administrator": "AARP-AAI-SHRD-PROD",
        "598885646065_Cloud_Administrator": "AARP-AAI-TEST",
        "832063073756_Cloud_Administrator": "AARP-EDP-DEV",
        "720291645793_Cloud_Administrator": "AARP-EDP-PROD",
        "655943739407_Cloud_Administrator": "AARP-EDP-TEST",
        "678361318728_Cloud_Administrator": "AARP-MSN-DEV",
        "776712925676_Cloud_Administrator": "AARP-MSN-PROD",
        "945106370403_Cloud_Administrator": "AARP-MSN-TEST",
        "422604304526_Cloud_Administrator": "AARP-NAV-DEV",
        "039750836913_Cloud_Administrator": "AARP-NAV-SHRD-PROD",
        "248642484126_Cloud_Administrator": "AARP-NAV-TEST",
        "971125448885_Cloud_Administrator": "AARP-OPS-DEV",
        "400814664048_Cloud_Administrator": "AARP-OPS-PROD",
        "718850988161_Cloud_Administrator": "AARP-OPS-TEST",
        "176625075033_Cloud_Administrator": "AARP_MASTER_176625075033_Cloud_Administrator"
    };

    // get a reference to the credentials dialog box
    var credentialsDialog = $( "#dialog-form" );

    // clear out any old text from the credentials dialog box
    credentialsDialog.find("#taTemporaryCredentials").val('');

    // define a prefix to add to all credential profile names (unless already present in friendly name definition)
    var credentialProfilePrefix = "AARP_";

    // use account name instead of accoutn number in profile definitions
    var useAccountNameInsteadOfNumber = true;

    // mapping between account numbers and anmes
    var accountNumbersToNamesMapping = {}

    var tempCredArr = [];
    var allPromises = [];

    // expand the 'AWS Account' section if needed
    if($("div.instance-section").length > 0) {
        console.log("the 'AWS Account' section is already expanded")
    } else {
        console.log("expand the 'AWS Account' section")
        $("portal-application").first().click()
    }

    // expand each individual aws account
    console.log("expand each individual aws account")
    $("div.instance-section").each(function( index ) {
        if($(this).parent().find("sso-expander").length > 0) {
            // account section already expanded
        } else {
            // expand the account section
            $(this).click();
        }
    });

    // define a way to wait before executing code
    var wait = ms => new Promise(resolve => setTimeout(resolve, ms));

    // wait 3 seconds
    console.log("wait 3 seconds")
    var waitForTempCredentialsButtonExpand = wait(3*1000);
    allPromises.push(waitForTempCredentialsButtonExpand);
    waitForTempCredentialsButtonExpand.then(() => {
        // map the account numbers to their names
        $("portal-instance-list portal-instance > div > div > div").each(function( index ) {
            let awsAccountDiv = $( this );
            let awsAccountName = awsAccountDiv.find("div.name").text().trim();
            let awsAccountNumber = awsAccountDiv.find("p.metadata > span.accountId").text().trim().replace("#", "");

            accountNumbersToNamesMapping[awsAccountNumber] = awsAccountName;
        });

        console.log("Account numbers and names:");
        console.log(accountNumbersToNamesMapping);

        // show the commandline parameters for each aws account profile
        console.log("show the commandline parameters for each aws account profile")
        $("a#temp-credentials-button").each(function( index ) {

            // show the temp credentials for each aws account
            console.log("show the temp credentials for account " + index)
            var jQueryTempCredentialButton = $( this )
            jQueryTempCredentialButton[0].click()

            // wait 2 seconds
            // console.log("wait 2 seconds")
            var waitForGetTempCredentialForProfile = wait(2*1000);
            allPromises.push(waitForGetTempCredentialForProfile);
            waitForGetTempCredentialForProfile.then(() => {
                var jqueryCredentialFileSection = $("div.code-section").eq(3)

                // get the credential profile - account and role profile
                var profile = jqueryCredentialFileSection.find("div.code-line").eq(0).text().trim()
                var profileRaw = profile.replace("[", "").replace("]", "");

                console.log("get the credential profile for - " + profile);

                // check to see if a friendly profile name has been defined
                if(credentialProfileFriendlyNames[profileRaw] !== undefined) {
                    profile = '[' + credentialProfileFriendlyNames[profileRaw] + ']';
                } else {
                    // check if option to use account name instead of account id was set
                    if(useAccountNameInsteadOfNumber) {
                        // get the accout id
                        let accountIdRegex = /[0-9]+/gi;
                        let accountId = profileRaw.match(accountIdRegex);
                        profile = '[' + credentialProfilePrefix + profileRaw.replace(accountId, accountNumbersToNamesMapping[accountId]) + ']'
                    } else {
                        profile = '[' + credentialProfilePrefix + profileRaw + ']'
                    }
                }

                // get the access key
                // console.log("get the access key")
                var accessKey = jqueryCredentialFileSection.find("div.code-line").eq(1).text().trim()

                // get the secret key
                // console.log("get the secret key")
                var secretKey = jqueryCredentialFileSection.find("div.code-line").eq(2).text().trim()

                // get the session token
                // console.log("get the session token")
                var sessionToken = jqueryCredentialFileSection.find("div.code-line").eq(3).text().trim()

                // console.log(profile + "\n" + accessKey + "\n" + secretKey + "\n" + sessionToken);
                tempCredArr.push(profile + "\n" + accessKey + "\n" + secretKey + "\n" + sessionToken)

                // close the credentials dialog box
                // console.log("close the credentials dialog box")
                $("creds-modal span.close")[0].click()

            });
        });

        Promise.all(allPromises).then(() => {
            var credsText = tempCredArr.join('\n\n');

            // output the consolidated credentials list once all credentials have been retrieved
            console.log('Found ' + tempCredArr.length + ' AWS temporary credentials: ');
            console.log(credsText);

            // set the credentials dialog box text
            credentialsDialog.find("#taTemporaryCredentials").val(credsText);

            // open the credentials dialog box
            credentialsDialog.dialog( "open" );

            // make sure the credentials dialog box is on top
            $(".ui-dialog").css("z-index", "1000");

            // increase the opacity of the dialog background
            $("div.ui-widget-overlay.ui-front").css("opacity", ".9");
        });
    });
}


