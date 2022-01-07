/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record','N/url'],
    function(record,url) {
        function beforeLoad(context) {
            var recInvoice = context.newRecord;
            if (context.type !== context.UserEventType.VIEW)
                return;
            var form = context.form;

            var stProject = recInvoice.getValue('job');
            if(stProject){}

            var urlLink =  getURL('customscript_lcc_sl_taxinvoice','customdeploy_lcc_sl_taxinvoice');
            urlLink += '&tranid='+recInvoice.id;
            var stOnCall = "window.open('" + urlLink+ "')" ;
            form.addButton({
                id : 'custpage_taxinvoice',
                label : 'Project Invoice',
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