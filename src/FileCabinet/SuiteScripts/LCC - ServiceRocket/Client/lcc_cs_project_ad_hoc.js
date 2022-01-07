/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/runtime', 'N/search', 'N/ui/message', 'N/url'],

function(currentRecord, runtime, search,  message, url) {
    
    function pageInit(scriptContext) {
    
    }
    
    function updateField(){
        log.debug("updatefield start,");
        var recordObj = currentRecord.get();
        //Add Message Box on the top of the form
        var messageObj = message.create({
            title: "Ad-hoc in process...",
            message: "Script is currently running. Please wait for 1-2 minutes.” ",
            type: message.Type.INFORMATION
        });
        var projectId = recordObj.id;
        log.debug("projectId", projectId)
        messageObj.show();
    
        window.onbeforeunload = function () {
        };
    
        //Build a URL link
        var urlHost = "https://";
        urlHost += url.resolveDomain({
            hostType: url.HostType.APPLICATION
        });
    
        var urlSL = url.resolveScript({
            scriptId: 'customscript_lcc_sl_project_ad_hoc',
            deploymentId: 'customdeploy_lcc_sl_project_ad_hoc',
            returnExternalUrl: false
        });
    
        log.debug("urlSL", urlSL);
        urlSL += '&projectId=' + projectId;
    
        //Trigger AD-HOC Script
        getSuitelet(urlSL);
        //HIDE THE BUTTON
        if (document.getElementById('custpage_sr_calculate_billable_contribution')) {
            document.getElementById('custpage_sr_calculate_billable_contribution').style.display = "none";
        }
    
    }
    
    function getSuitelet(url)
    {
        
        var request = new XMLHttpRequest();
        request.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                window.location.reload();
            }
        };
        request.open('GET', url);
        request.send();
        log.debug("getSuitelet end");
    }
    
  
    return {
        pageInit: pageInit,
        updateField: updateField
    };
    
});
