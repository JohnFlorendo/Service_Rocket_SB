/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/ui/serverWidget', '../Library/handlebars-v4.7.6', 'N/file', 'N/search'],

function(record, serverWidget, libHandleBars, file, search) {
   
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
        addNotice(scriptContext);
        totalBillingForecastBeforeLoad(scriptContext);
    }

    function totalsChecker(objData){
        try{
            var pageTemplate = file.load({
                id: '../Template/noticeHandlebar.html'
            }).getContents()
            var hbTemplate = libHandleBars.compile(pageTemplate);

            libHandleBars.registerHelper("totalsChecker", function(billingForecastTotal, amountInvoiced, options){
                if(billingForecastTotal <= amountInvoiced){
                    return options.fn(this);
                } else {
                    return options.inverse(this);
                }
            })

            var billData = objData;

        } catch (e) {
            log.debug('error in totalsChecker()', e);
        }
        return hbTemplate(billData);
    }

    function getNoticeData(scriptContext){
        var objRecord = scriptContext.newRecord;
        var objNotice = {};

        var intInvoiceId = getInvoicesIdBySO(objRecord.id);
        var amountInvoiced =  getInvoiceAmountPaid(intInvoiceId);

        var forecastTotal = objRecord.getValue({
            fieldId: 'custbody_sr_bill_forecast_total_amt'
        });

        objNotice.billingForecastTotal = forecastTotal;
        objNotice.amountInvoiced = amountInvoiced;

        log.debug('objNotice', objNotice);
        return objNotice;
    }

    function addNotice(scriptContext){
        try{
            var recordSO = scriptContext.newRecord;
            if(recordSO.type == 'salesorder'){
                var objNoticeData = getNoticeData(scriptContext);
                var htmlNotice = totalsChecker(objNoticeData);

                recordSO.setValue({
                    fieldId: 'custbody_noticehtml',
                    value: htmlNotice,
                });
            }
        } catch (e) {
            log.debug('error in addNotice()', e);
        }
    }

    function totalBillingForecastBeforeLoad(scriptContext) {
        try{
            var objRecord = scriptContext.newRecord;

            if(objRecord.type == 'salesorder'){
                var forecastTotal = objRecord.getValue({
                    fieldId: 'custbody_sr_bill_forecast_total_amt'
                });

                var intInvoiceId = getInvoicesIdBySO(objRecord.id);
                var amountInvoiced =  getInvoiceAmountPaid(intInvoiceId);

                var forecastRemaining = forecastTotal - amountInvoiced

                addBillingForecastFields(scriptContext, amountInvoiced, forecastTotal, forecastRemaining)

                log.debug('beforeLoad: amountInvoiced', amountInvoiced);
                log.debug('beforeLoad: forecastTotal', forecastTotal);
                log.debug('beforeLoad: forecastRemaining', forecastRemaining);
            }
        } catch (e) {
            log.debug('error in totalBillingForecastBeforeLoad()', e);
        }
    }

    function totalBillingForecast(scriptContext){
        try{
            var objRecord = scriptContext.newRecord;
            log.debug('afterSubmit: objRecordType', objRecord.type);
            if(objRecord.type == 'salesorder'){
                var forecastLineCount = objRecord.getLineCount({
                    sublistId: 'recmachcustrecord_ct_original_so_no'
                })
                log.debug('afterSubmit SO: objRecord ID', objRecord.id);
                var intInvoiceId = getInvoicesIdBySO(objRecord.id);
                var amountInvoiced =  getInvoiceAmountPaid(intInvoiceId);

                //Billing Forecast Heirarchy:
                // 1. Get the total values from the Billing Forecast subtab lines. If there are no Billing Forecast lines,
                var forecastTotal = 0;
                if(forecastLineCount > 0){
                    for(var lineCount = 0; lineCount < forecastLineCount; lineCount++){
                        var forecastAmount = objRecord.getSublistValue({
                            sublistId: 'recmachcustrecord_ct_original_so_no',
                            fieldId: 'custrecord_ct_forecast_amount',
                            line: lineCount
                        })
                        if(forecastAmount)
                            forecastTotal += forecastAmount;
                    }
                }
                // 2. Get the total billing schedule values from the Billing > Schedule subtab
                else{
                    var recordSO = record.load({
                        type: 'salesorder',
                        id: objRecord.id,
                        isDynamic: true
                    });

                    var billingLineCount = recordSO.getLineCount({
                        sublistId: 'billingschedule'
                    });

                    for(var count = 0; count < billingLineCount; count++){
                        recordSO.selectLine({
                            sublistId: 'billingschedule',
                            line: count
                        })

                        var billAmount = recordSO.getCurrentSublistValue({
                            sublistId: 'billingschedule',
                            fieldId: 'billamount',
                        })

                        if(billAmount)
                            forecastTotal += billAmount;
                    }
                }
                var forecastAmountRemaining = forecastTotal - amountInvoiced

                log.debug('afterSubmit SO: total', forecastTotal)
                log.debug('afterSubmit SO: invoiced', amountInvoiced);
                log.debug('afterSubmit SO: remaining', forecastAmountRemaining);

                record.submitFields({
                    type: objRecord.type,
                    id: objRecord.id,
                    values: {
                        'custbody_sr_bill_forecast_total_amt' : forecastTotal,
                        'custbody_sr_bill_forecast_amt_remain' : forecastAmountRemaining
                    }
                });
            }
            else if(objRecord.type == 'customrecord_ct_billing_forecast'){
                var totalForecastBill;
                var remainingForecastAmount;

                var salesOrderId = objRecord.getValue({
                    fieldId: 'custrecord_ct_original_so_no'
                });

                if(salesOrderId != ''){
                    var intInvoiceId = getInvoicesIdBySO(salesOrderId);
                    var amountInvoiced =  getInvoiceAmountPaid(intInvoiceId);

                    totalForecastBill = searchSOBillForecast(salesOrderId);

                    remainingForecastAmount = totalForecastBill - amountInvoiced

                    record.submitFields({
                        type: record.Type.SALES_ORDER,
                        id: salesOrderId,
                        values: {
                            'custbody_sr_bill_forecast_total_amt' : totalForecastBill,
                            'custbody_sr_bill_forecast_amt_remain' : remainingForecastAmount
                        }
                    });
                }
                else{
                    var oldBFRecord = scriptContext.oldRecord;
                    var oldSOId = oldBFRecord.getValue({
                        fieldId: 'custrecord_ct_original_so_no'
                    });

                    var intInvoiceId = getInvoicesIdBySO(oldSOId);
                    var amountInvoiced =  getInvoiceAmountPaid(intInvoiceId);

                    totalForecastBill = searchSOBillForecast(oldSOId);

                    remainingForecastAmount = totalForecastBill - amountInvoiced

                    record.submitFields({
                        type: record.Type.SALES_ORDER,
                        id: oldSOId,
                        values: {
                            'custbody_sr_bill_forecast_total_amt' : totalForecastBill,
                            'custbody_sr_bill_forecast_amt_remain' : remainingForecastAmount
                        }
                    });
                }
                log.debug('afterSubmit BF: total:', totalForecastBill);
                log.debug('afterSubmit BF: invoiced:', amountInvoiced);
                log.debug('afterSubmit BF: remain:', remainingForecastAmount)
            }
        } catch (e) {
            log.debug('error in totalBillingForecast()', e);
        }
    }

    function searchSOBillForecast(salesOrderId){
        try{
            if(salesOrderId){
                var customrecord_ct_billing_forecastSearchObj = search.create({
                    type: "customrecord_ct_billing_forecast",
                    filters:
                        [
                            ["custrecord_ct_original_so_no","anyof",salesOrderId]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "custrecord_ct_forecast_amount",
                                summary: "SUM"
                            })
                        ]
                });
                var searchResultCount = customrecord_ct_billing_forecastSearchObj.runPaged().count;
                log.debug("customrecord_ct_billing_forecastSearchObj result count",searchResultCount);
                var searchResult = customrecord_ct_billing_forecastSearchObj.run().getRange({
                    start: 0,
                    end: 999
                });

                for (var searchCount = 0; searchCount < searchResult.length; searchCount++) {
                    var data = searchResult[searchCount];

                    var total = data.getValue({
                        name: 'custrecord_ct_forecast_amount',
                        summary: search.Summary.SUM
                    });
                }
            }
        } catch (e) {
            log.debug('error in searchSOBillForecast()', e);
        }
        return total;
    }

    function addBillingForecastFields(scriptContext, invoiceAmount, invoiceTotal, invoiceRemain){
        var objRecord = scriptContext.newRecord;
        var form = scriptContext.form;
        try{
            if(objRecord.type == 'salesorder') {
                form.addField({
                    id: 'custpage_sr_amount_invoiced_cust',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Amount to be Invoiced',
                    container: "custom462"
                }).defaultValue = invoiceAmount;

                form.addField({
                    id: 'custpage_sr_bill_forecast_total_amt_cust',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Billing Forecast Total',
                    container: "custom462"
                }).defaultValue = invoiceTotal;

                form.addField({
                    id: 'custpage_sr_bill_forecast_amt_remain_cust',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Forecast Amount Remaining',
                    container: "custom462"
                }).defaultValue = invoiceRemain
            }
        }catch (e) {
            log.debug('error in addBillingForecastFields()', e);
        }
    }

    function getInvoiceAmountPaid(intInvoiceId){
        var flInvoicedAmount = 0;
        if(intInvoiceId != '' && intInvoiceId != null && intInvoiceId != undefined) {
            var salesorderSearchObj = search.load({ id: 'customsearch_sr_amountpaid_invoice' });
            var filters = salesorderSearchObj.filters;
            filters.push({ name: "internalid", operator: "is", values: intInvoiceId.toString() });
            salesorderSearchObj.filters = [];
            salesorderSearchObj.filters = filters;
            var searchResultCount = salesorderSearchObj.runPaged().count;

            if(searchResultCount != 0) {
                salesorderSearchObj.run().each(function(result){
                    var stNetAmt = result.getValue({name: "amountpaid", summary: "SUM", sort: search.Sort.ASC});
                    flInvoicedAmount = (stNetAmt == '') ? 0 : parseFloat(stNetAmt);
                    return true;
                });
            }
        }
        return flInvoicedAmount;
    }

    function getInvoicesIdBySO(intSalesOrderId) {
        var intInvoiceId;
        if(intSalesOrderId) {
            var invoiceSearchObj = search.load({id: 'customsearch_sr_amt_so_inv_project'});
            var filters = invoiceSearchObj.filters;
            filters.push({name: "createdfrom", operator: "anyof", values: intSalesOrderId.toString()});
            invoiceSearchObj.filters = [];
            invoiceSearchObj.filters = filters;
            var searchResultCount = invoiceSearchObj.runPaged().count;
            if (searchResultCount != 0) {
                invoiceSearchObj.run().each(function (result) {
                    intInvoiceId = result.id;
                    return true;
                });
            }
        }

        return intInvoiceId;
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

    function beforeSubmit(scriptContext) {
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
    function afterSubmit(scriptContext) {
        totalBillingForecast(scriptContext);
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
