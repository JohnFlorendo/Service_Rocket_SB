/*
ID:             customscript_sr_mr_invoice_download_pdf
Name:           SR - MR Invoice Download PDF
Purpose:        Generate/Download Invoice PDF
Created On:     May 5, 2021
Author:         Ceana Technology
Saved Searches: ** Yaypay Script Use - Do Not Delete
 */
/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/runtime','../Library/sr_lib_invoice_template'],
    function(runtime,libHelper) {
        var originalFolderId = 3878;

        var currScript = runtime.getCurrentScript();
        function getInputData() {
            var paramSearchId = currScript.getParameter('custscript_sr_yaypay_search');
            var arrInvoices = libHelper.searchAllInvoices(paramSearchId);
            return arrInvoices;
        }
        function map(context) {
            var paramFolderId = currScript.getParameter('custscript_sr_yp_param_folder');
            var folderId = (paramFolderId) ? paramFolderId : originalFolderId;

            var objInvoice = JSON.parse(context.value);
            if(objInvoice.id){
                libHelper.generatePDF(objInvoice.id,folderId);
            }
        }
        function reduce(context) {

        }
        function summarize(summary) {

        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };

    });
