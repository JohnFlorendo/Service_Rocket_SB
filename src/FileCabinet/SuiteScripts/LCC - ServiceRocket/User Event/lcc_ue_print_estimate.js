/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/url'],
function(record,url) {
    function beforeLoad(context) {
        var recEstimate = context.newRecord;
        if (context.type !== context.UserEventType.VIEW)
            return;
        var form = context.form;
        var qouteType = recEstimate.getValue({
            fieldId : 'custbody_quote_type'
        });

        var labelName = '';
        var urlLink = '';
      
      
        if(qouteType == 1 || qouteType == 3 || qouteType == 4){
            labelName =  'Generate Product Quote';
            urlLink =  getURL('customscript_suitepdf_sl','customdeploy_suitepdf_sl');
        	urlLink += '&type=estimate&id='+ recEstimate.id;
          
        }else if(qouteType == 2){
            labelName =  'Print Statement of Work';
            urlLink =  getURL('customscript_lcc_sl_print_estimate','customdeploy_lcc_sl_print_estimate');
        	urlLink += '&tranid='+recEstimate.id;
        }else{
            return;
        }


        //urlLink =  getURL('customscript_lcc_sl_print_estimate','customdeploy_lcc_sl_print_estimate');
        //urlLink += '&tranid='+recEstimate.id;
        var stOnCall = "window.open('" + urlLink+ "')" ;
        form.addButton({
            id : 'custpage_print',
            label : labelName,
            functionName : stOnCall
        });

    }

    function  getURL(stScript,stDeployment) {
        var urlLink =  url.resolveScript({
            scriptId: stScript,
            deploymentId: stDeployment,
            returnExternalUrl: false
        });

        return urlLink;
    }


    return {
        beforeLoad: beforeLoad
    };
    
});
