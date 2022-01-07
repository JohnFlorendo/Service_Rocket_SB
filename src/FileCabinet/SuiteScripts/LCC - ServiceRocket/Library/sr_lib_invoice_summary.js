define(['N/record', 'N/search','./lcc_lib_payroll.js'],
/**
 * @param{record} record
 * @param{search} search
 */
function(record, search,libHelper) {
    var fn = {};
    fn.getSalesOrders = function (searchId){
        var arrResults = [];

        var salesOrderSearchObj = search.load({
            id : searchId
        });

        var myPagedData = salesOrderSearchObj.runPaged({
            pageSize: 1000
        });

        try {
            myPagedData.pageRanges.forEach(function(pageRange) {
                var myPage = myPagedData.fetch({
                    index: pageRange.index
                });
                myPage.data.forEach(function(result) {
                    arrResults.push(result.id);
                });
            });
        } catch (e) {
            log.debug(e);
        }
        return arrResults;
    }

    fn.updateInvoiceSummaryFields = function (salesOrderId) {
        try {
            var recSalesOrder = record.load({
                type : record.Type.SALES_ORDER,
                id : salesOrderId
            });
            var stJob = recSalesOrder.getValue('job');
            var objInvoiceSummary = fn.invoiceSummaryResults(salesOrderId,stJob);
            log.debug('objInvoiceSummary',objInvoiceSummary);
            //UPDATE RECORD
            record.submitFields({
                type : record.Type.SALES_ORDER,
                id : salesOrderId,
                values : {
                    custbody_sr_amount_invoiced : (objInvoiceSummary.amountInvoice) ? objInvoiceSummary.amountInvoice : 0,
                    custbody_sr_tax_amount : (objInvoiceSummary.amountTax) ? objInvoiceSummary.amountTax : 0,
                    custbody_sr_amount_before_gst : (objInvoiceSummary.amountBeforeGST) ? objInvoiceSummary.amountBeforeGST : 0,
                    custbody_sr_amount_remaining : (objInvoiceSummary.amountRemaining) ? objInvoiceSummary.amountRemaining : 0
                }
            });
        } catch (e) {
            log.debug('error : updateInvoiceSummaryFields', e);
        }
    }

    fn.invoiceSummaryResults = function (salesOrderId,jobId) {
        var flAmountStandAloneInvoicesByProject = null;
        if (!jobId) {
            log.debug('getInvoiceAmountBeforeGST');
            flAmountStandAloneInvoicesByProject = getInvoiceAmountBeforeGST(salesOrderId); /*getInvoicedAmount(salesOrderId);*/
        } else {
            log.debug('getInvoicedAmountByProject');
            flAmountStandAloneInvoicesByProject = getInvoicedAmountByProject(jobId, salesOrderId);
        }
        //GET THE GST AND TAX
        var objGstAndTax = getSOBeforeGSTAndTax(salesOrderId,jobId);
        var amountInvoice = parseFloat(flAmountStandAloneInvoicesByProject);
        var amountBeforeGST = objGstAndTax.flBeforeGST;
        var amountTax = objGstAndTax.flTax;
        //GET REMAINING AMOUNT
        var amountRemaining = Number(amountBeforeGST - amountInvoice);

        return {
            invoiceAmountStandAlone: flAmountStandAloneInvoicesByProject,
            amountInvoice: amountInvoice,
            amountBeforeGST: amountBeforeGST,
            amountRemaining: amountRemaining,
            amountTax: amountTax
        }
    }


    function getSOBeforeGSTAndTax(intSOId,jobId) {
        var objData = { flBeforeGST : 0, flTax : 0 };
        if(intSOId != '') {
            var salesorderSearchObj = search.load({ id: 'customsearch_sr_amt_so_beforegst_tax' });
            var filters = salesorderSearchObj.filters;
            filters.push({ name: "internalid", operator: "is", values: intSOId.toString() });
            salesorderSearchObj.filters = [];
            salesorderSearchObj.filters = filters;
            var searchResultCount = salesorderSearchObj.runPaged().count;

            if(searchResultCount != 0) {
                salesorderSearchObj.run().each(function(result) {
                    var stBeforeGST = 0;
                    if(jobId){
                        stBeforeGST = result.getValue({name: "recognizedrevenue", summary: "SUM"});
                    }else{
                        stBeforeGST = result.getValue({name: "fxamount", summary: "SUM"});
                    }
                    var stTax = result.getValue({name: "taxamount", summary: "SUM"});
                    objData.flBeforeGST = (stBeforeGST == '') ? 0 : parseFloat(stBeforeGST);
                    objData.flTax = (stTax == '') ? 0 : parseFloat(stTax);
                    return true;
                });
            }
        }
        return objData;
    }

    function getInvoicedAmount(intSOId) {
        var flInvoicedAmount = 0;
        if(intSOId != '') {
            var salesorderSearchObj = search.load({ id: 'customsearch_sr_amount_invoiced_project' });
            var filters = salesorderSearchObj.filters;
            filters.push({ name: "internalid", operator: "is", values: intSOId.toString() });
            salesorderSearchObj.filters = [];
            salesorderSearchObj.filters = filters;
            var searchResultCount = salesorderSearchObj.runPaged().count;

            if(searchResultCount != 0) {
                salesorderSearchObj.run().each(function(result){
                    var stNetAmt = result.getValue({name: "netamountnotax", join: "billingTransaction", summary: "SUM", sort: search.Sort.ASC});
                    flInvoicedAmount = (stNetAmt == '') ? 0 : parseFloat(stNetAmt);
                    return true;
                });
            }
        }

        return flInvoicedAmount;
    }

    function getInvoicedAmountByProject(intProjectId, intSalesOrderId) {
        var objStandAloneInvoices = getStandAloneInvoices(intProjectId);
        var objInvoices = getInvoicesBySO(intSalesOrderId);
        var objSOProjects = getSOByProject(intProjectId);
        var objSOTotal = {};
        var flAmount = 0;

        /** Invoices Linked to SO **/
        for(var intInvoiceIndex in objInvoices) {
            var dtSIDate = libHelper.getFormattedDate(objInvoices[intInvoiceIndex].trandate);
            for(var intSOIndex in objSOProjects) {
                var dtSODate = libHelper.getFormattedDate(objSOProjects[intSOIndex].trandate);

                //if(dtSIDate >= dtSODate) { } removed as per discussion with jers

                if(objSOTotal[objSOProjects[intSOIndex].internalid] == null) {
                    objSOTotal[objSOProjects[intSOIndex].internalid] = {};
                }
                if(objSOTotal[objSOProjects[intSOIndex].internalid][objInvoices[intInvoiceIndex].internalid] == null) {
                    objSOTotal[objSOProjects[intSOIndex].internalid][objInvoices[intInvoiceIndex].internalid] = {};
                }
                objSOTotal[objSOProjects[intSOIndex].internalid][objInvoices[intInvoiceIndex].internalid] = objInvoices[intInvoiceIndex];

            }
        }

        /** Stand Alone Invoices **/
        for(var intInvoiceIndex in objStandAloneInvoices) {
            var dtSIDate = libHelper.getFormattedDate(objStandAloneInvoices[intInvoiceIndex].trandate);
            for(var intSOIndex in objSOProjects) {
                var dtSODate = libHelper.getFormattedDate(objSOProjects[intSOIndex].trandate);

                if(dtSIDate >= dtSODate) {
                    var isExist = false;
                    for(var intIndexSOTotalIndex in objSOTotal) {
                        if(objSOProjects[intSOIndex].internalid != intIndexSOTotalIndex && objSOTotal[intIndexSOTotalIndex][intInvoiceIndex] != null) { isExist = true; }
                    }

                    if(!isExist) {
                        if(objSOTotal[objSOProjects[intSOIndex].internalid] == null) { objSOTotal[objSOProjects[intSOIndex].internalid] = {}; }
                        if(objSOTotal[objSOProjects[intSOIndex].internalid][objStandAloneInvoices[intInvoiceIndex].internalid] == null) {
                            objSOTotal[objSOProjects[intSOIndex].internalid][objStandAloneInvoices[intInvoiceIndex].internalid] = {};
                        }
                        objSOTotal[objSOProjects[intSOIndex].internalid][objStandAloneInvoices[intInvoiceIndex].internalid] = objStandAloneInvoices[intInvoiceIndex];
                    }
                }
            }
        }

        log.debug('objSOTotal',objSOTotal);

        for(var intIndex in objSOTotal[intSalesOrderId]) {
            flAmount = parseFloat(parseFloat(flAmount) + parseFloat(objSOTotal[intSalesOrderId][intIndex].amount)).toFixed(2);
        }

        return flAmount;
    }

    function getStandAloneInvoices(intProjectId) {
        var arrInvoices = {};

        if(intProjectId == '' || intProjectId == null){ return arrInvoices; }

        var invoiceSearchObj = search.load({ id: 'customsearch_sr_amt_inv_proj_stand_alone' });
        var filters = invoiceSearchObj.filters;
        filters.push({ name: "internalid", join: 'jobmain', operator: "anyof", values: intProjectId.toString() });
        invoiceSearchObj.filters = [];
        invoiceSearchObj.filters = filters;
        var searchResultCount = invoiceSearchObj.runPaged().count;
        if(searchResultCount != 0) {
            invoiceSearchObj.run().each(function(result){
                if(arrInvoices[result.id] == null) { arrInvoices[result.id] = { amount:0 }; }
                arrInvoices[result.id].internalid = result.id;
                arrInvoices[result.id].trandate = result.getValue({name: "trandate"});
                arrInvoices[result.id].tranid = result.getValue({name: "tranid"});
                arrInvoices[result.id].account = result.getText({name: "account"});
                arrInvoices[result.id].status = result.getText({name: "statusref"});
                arrInvoices[result.id].amount = parseFloat(parseFloat(arrInvoices[result.id].amount) + parseFloat(result.getValue({name: "netamountnotax"}))).toFixed(2);
                return true;
            });
        }

        // log.debug('arrInvoices', arrInvoices);

        return arrInvoices;
    }
    function getInvoicesBySO(intSalesOrderId) {
        var arrInvoices = {};

        var invoiceSearchObj = search.load({ id: 'customsearch_sr_amt_so_inv_project' });
        var filters = invoiceSearchObj.filters;
        filters.push({name: "createdfrom", operator: "anyof", values: intSalesOrderId.toString()});
        invoiceSearchObj.filters = [];
        invoiceSearchObj.filters = filters;

        var searchResultCount = invoiceSearchObj.runPaged().count;

        log.debug('getInvoicesBySO Count', searchResultCount);

        if(searchResultCount != 0) {
            invoiceSearchObj.run().each(function(result){
                if(arrInvoices[result.id] == null) { arrInvoices[result.id] = { amount:0 }; }
                arrInvoices[result.id].internalid = result.id;
                arrInvoices[result.id].trandate = result.getValue({name: "trandate"});
                arrInvoices[result.id].tranid = result.getValue({name: "tranid"});
                arrInvoices[result.id].account = result.getText({name: "account"});
                arrInvoices[result.id].status = result.getText({name: "statusref"});
                arrInvoices[result.id].amount = parseFloat(parseFloat(arrInvoices[result.id].amount) + parseFloat(result.getValue({name: "netamountnotax"}))).toFixed(2);
                return true;
            });
        }

        return arrInvoices;
    }
    function getSOByProject(intProjectId) {
        var arrSalesOrders = [];

        if(intProjectId == '' || intProjectId == null){ return arrSalesOrders; }

        var salesorderSearchObj = search.create({
            type: "salesorder",
            filters: [
                ["mainline","is","T"],"AND",
                ["jobmain.internalid","anyof", intProjectId]
            ],
            columns: [
                search.createColumn({name: "trandate", sort: search.Sort.DESC}),
                search.createColumn({name: "tranid"}),
                search.createColumn({name: "amount"}),
                search.createColumn({name: "status"})
            ]
        });
        var searchResultCount = salesorderSearchObj.runPaged().count;
        if(searchResultCount != 0) {
            salesorderSearchObj.run().each(function(result){
                arrSalesOrders.push({
                    internalid: result.id,
                    trandate : result.getValue({name: "trandate"}),
                    tranid : result.getValue({name: "tranid"}),
                    amount : result.getValue({name: "amount"}),
                    status : result.getValue({name: "statusref"}),
                });
                return true;
            });
        }
        // log.debug('arrSalesOrders', arrSalesOrders);

        return arrSalesOrders;
    }


    function getInvoiceAmountBeforeGST(salesOrderId) {
        var inTotal = 0;

        var invSearch = search.load({
            id: 'customsearch_sr_amt_so_inv_project'
        });
        var filters = invSearch.filters;
        filters.push({
            name: "createdfrom", operator: "anyof", values: salesOrderId.toString()
        });
        invSearch.filters = [];
        invSearch.filters = filters;

        var searchResultCount = invSearch.runPaged().count;

        log.debug('getInvoiceAmountBeforeGST', searchResultCount);

        if (searchResultCount != 0) {
            invSearch.run().each(function (result) {
                var amount = result.getValue({name: "fxamount"});
                inTotal += (Number(amount))? Number(amount) : 0;
              return true;
            });
        }

        return inTotal;
    }



    return fn;
    
});
