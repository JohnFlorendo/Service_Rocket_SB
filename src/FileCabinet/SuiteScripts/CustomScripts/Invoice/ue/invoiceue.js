/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/url', 'N/ui/serverWidget', 'N/file'],
    /**
     * @param {runtime} runtime
     * @param {record} record
     */

    function (record, runtime, url, serverWidget, file) {

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {

        var currForm = scriptContext.newRecord;

        try {

            if (scriptContext.type == scriptContext.UserEventType.VIEW) {

                var form = scriptContext.form;
                var newRec = scriptContext.newRecord;
                var html = file.load({
                    id: 171017
                }).getContents(); //btnhtml.html

                var insertHml = form.addField({
                    id: 'custpage_pa_jquery1',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: 'JQ'
                });

                if ([617, 5682, 7036, 8754, 8972, 171596].indexOf(runtime.getCurrentUser().id) > -1) {

                    var sURL = url.resolveScript({
                        scriptId: 'customscript_suitepdf_sl',
                        deploymentId: 'customdeploy_suitepdf_sl'
                    });
                    sURL += '&type=invoice&id=' + newRec.id;

                    html = html.replace('{surl1}', sURL);
                    insertHml.defaultValue = html;

                    form.addButton({
                        id: 'custpage_btn_print',
                        label: 'Generate Invoice(test)',
                        functionName: 'generateAtlInvoice'
                    });
                }
            }
        } 
        catch (err) {
            log.audit({
                title: 'invoice.beforeLoad',
                details: 'err: ' + err
            });
        }

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {}

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {

    }

    return {
    	beforeLoad: beforeLoad
    };

});
