/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/url', 'N/ui/message', 'N/ui/serverWidget', 'N/task', '../Library/lcc_lib_payroll', 'N/runtime', '../Library/lcc_lib_field_mapping'],
    function (record, search, url, message, serverWidget, task, libHelper, runtime, libFieldMapping) {

        //internal ids, 3 - Admin, 1058 - Rocketeer Project Operations
        const allowedRoles = [3, 1058];

        function beforeLoad(context) {
            if (context.type == 'view' || context.type == 'edit') {
                var form = context.form;
                var newRecord = context.newRecord;
                showInvoiceSummaryFields(form, newRecord);
                var sublistInvoices = form.addSublist({
                    id: 'custpage_sublistinvoices',
                    type: serverWidget.SublistType.LIST,
                    tab: 'custpage_tabinvoicesummary',
                    label: 'Invoices'
                });
                sublistInvoices.displayType = serverWidget.SublistDisplayType.NORMAL;
                addColumnsToInvoicesSublist(form, sublistInvoices);
                populateInvoicesSublist(newRecord, sublistInvoices);
            }
        }

        function afterSubmit(context) {
            try {
                var recId = context.newRecord.id;
                log.debug('afterSubmit=>recId', recId);
                if (recId) {
                    var mrTask = task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: 'customscript_sr_mr_salesorder_inv_sum',
                        deploymentId: null,
                        params: {
                            custscript_sr_param_salesorder: recId
                        }
                    });
                    // Submit the map/reduce task
                    var mrTaskId = mrTask.submit();
                    log.debug('mrTaskId', mrTaskId);
                }
            } catch (e) {
                log.debug('afterSubmit=>e', e);
            }
        }

        /**FUNCTION**/

        function showInvoiceSummaryFields(form, newRecord) {
            var inAmountInvoice = newRecord.getValue({
                fieldId: 'custbody_sr_amount_invoiced'
            });

            var inTaxAmount = newRecord.getValue({
                fieldId: 'custbody_sr_tax_amount'
            });
            var inBeforeGST = newRecord.getValue({
                fieldId: 'custbody_sr_amount_before_gst'
            });
            var inRemainingAmount = newRecord.getValue({
                fieldId: 'custbody_sr_amount_remaining'
            });

            // var obj = taxAmountInvoice(newRecord.getValue('job'));

            form.addTab({id: 'custpage_tabinvoicesummary', label: 'Invoice Summary'});
            // form.addField({
            //     id: 'custpage_subtotal',
            //     type: serverWidget.FieldType.CURRENCY,
            //     label: 'Amount (Before GST)',
            //     container: "custpage_tabinvoicesummary"
            // }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE}).defaultValue = inBeforeGST;
            //
            // form.addField({
            //     id: 'custpage_taxamount',
            //     type: serverWidget.FieldType.CURRENCY,
            //     label: 'Tax Amount',
            //     container: "custpage_tabinvoicesummary"
            // }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE}).defaultValue = inTaxAmount;
            //
            // form.addField({
            //     id: 'custpage_amountinvoiced',
            //     type: serverWidget.FieldType.CURRENCY,
            //     label: 'Amount Invoiced (Before GST)',
            //     container: "custpage_tabinvoicesummary"
            // }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE}).defaultValue = inAmountInvoice;
            //
            // form.addField({
            //     id: 'custpage_amountremaining',
            //     type: serverWidget.FieldType.CURRENCY,
            //     label: 'Amount Remaining (After GST)',
            //     container: "custpage_tabinvoicesummary"
            // }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE}).defaultValue = inRemainingAmount;

            var inAmountInv = 0;
            var inTaxAmountInv = 0;
            var inProjectId = newRecord.getValue({
                fieldId: 'job'
            });
            var inAmountSO = newRecord.getValue({
                fieldId: 'subtotal'
            });
            var inTaxAmountSO = newRecord.getValue({
                fieldId: 'taxtotal'
            });
            var objInvoices = getInvoiceRecordBySalesOrder(newRecord.id);

            if (inProjectId == '') {
                log.debug('objInvoices if', objInvoices);
                for (var indx in objInvoices) {
                    inAmountInv += objInvoices[indx].inAmount;
                    // if (objInvoices[indx].inAmount) {
                    //     inAmountInv = objInvoices[indx].inAmount
                    // }
                    inTaxAmountInv += objInvoices[indx].inTaxAmount;
                    // if (objInvoices[indx].inTaxAmount) {
                    //     inTaxAmountInv = objInvoices[indx].inTaxAmount
                    // }
                }
            } else {
                log.debug('objInvoices else', objInvoices);
                for (var indx in objInvoices) {
                    inAmountInv += objInvoices[indx].inAmount;
                    // if (objInvoices[indx].inAmount) {
                    //     inAmountInv = objInvoices[indx].inAmount
                    // }
                    inTaxAmountInv += objInvoices[indx].inTaxAmount;
                    // if (objInvoices[indx].inTaxAmount) {
                    //     inTaxAmountInv = objInvoices[indx].inTaxAmount
                    // }
                }

                var objStandAloneInvoices = getStandAloneInvoiceRecord(inProjectId);
                log.debug('objStandAloneInvoices', objStandAloneInvoices);
                for (var indx in objStandAloneInvoices) {
                    inAmountInv += objStandAloneInvoices[indx].inAmount;
                    // if (objStandAloneInvoices[indx].inAmount) {
                    //     inAmountInv = objStandAloneInvoices[indx].inAmount
                    // }
                    inTaxAmountInv += objStandAloneInvoices[indx].inTaxAmount;
                    // if (objStandAloneInvoices[indx].inTaxAmount) {
                    //     inTaxAmountInv = objStandAloneInvoices[indx].inTaxAmount
                    // }
                }
            }

            for (var field in libFieldMapping.invoiceSummaryFields) {
                var fields = libFieldMapping.invoiceSummaryFields[field];
                form.addField({
                    id: fields.id,
                    type: serverWidget.FieldType[fields.type],
                    label: fields.label,
                    container: fields.container
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType[fields.displayType]
                }).updateBreakType({
                    breakType: serverWidget.FieldBreakType[fields.breakType]
                });
            }

            form.updateDefaultValues({
                custpage_amt_of_so_before: (inAmountSO) ? inAmountSO : 0,
                custpage_tax_amt_so: (inTaxAmountSO) ? inTaxAmountSO : 0,
                custpage_amt_invoiced_before: inAmountInv,
                custpage_tax_amt_inv: inTaxAmountInv,
                custpage_amt_remaining: inAmountSO - inAmountInv,
                custpage_tax_amt_remaining: inTaxAmountSO - inTaxAmountInv
            });

            var inTotalSO = Number(newRecord.getValue('custpage_amt_of_so_before')) + Number(newRecord.getValue('custpage_tax_amt_so'));
            var inTotalInv = Number(newRecord.getValue('custpage_amt_invoiced_before')) + Number(newRecord.getValue('custpage_tax_amt_inv'));;
            var inAmountRemainingLast = Number(newRecord.getValue('custpage_amt_remaining')) + Number(newRecord.getValue('custpage_tax_amt_remaining'));
            form.updateDefaultValues({
                custpage_total_amt_so: inTotalSO,
                custpage_total_amt_inv: inTotalInv,
                custpage_amt_remaining_last: inAmountRemainingLast
            });
        }

        function oldInvoiceSummary(form, newRecord) {
            if (newRecord.getValue('job') == "") {
                // var flAmountStandAloneInvoicesByProject = getInvoicedAmount(newRecord.id);
                var flAmountStandAloneInvoicesByProject = getInvoicesIdBySO(newRecord.id);

                log.debug('flAmountStandAloneInvoicesByProject', flAmountStandAloneInvoicesByProject);

                // var flAmountStandAloneInvoicesByProject =  getInvoiceAmountPaid(arrInvoiceId);
            } else {
                var flAmountStandAloneInvoicesByProject = getInvoicedAmountByProject(newRecord.getValue('job'), newRecord.id);
            }

            // var flAmountInvoiced = (stAmountInvoiced == '') ? 0 : parseFloat(stAmountInvoiced);
            // var flSubTotal = (newRecord.getValue('subtotal') == '') ? 0 : parseFloat(newRecord.getValue('subtotal'));
            var flTotalAmountInvoiced = parseFloat(flAmountStandAloneInvoicesByProject);
            var objBeforeGSTAndTax = getSOBeforeGSTAndTax(newRecord.id);

            form.addTab({id: 'custpage_tabinvoicesummary', label: 'Invoice Summary'});
            form.addField({
                id: 'custpage_subtotal',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Amount (Before GST)',
                container: "custpage_tabinvoicesummary"
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE}).defaultValue = objBeforeGSTAndTax.flBeforeGST;

            form.addField({
                id: 'custpage_taxamount',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Tax Amount',
                container: "custpage_tabinvoicesummary"
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE}).defaultValue = objBeforeGSTAndTax.flTax;

            form.addField({
                id: 'custpage_amountinvoiced',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Amount Invoiced',
                container: "custpage_tabinvoicesummary"
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE}).defaultValue = flTotalAmountInvoiced;

            form.addField({
                id: 'custpage_amountremaining',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Amount Remaining',
                container: "custpage_tabinvoicesummary"
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE}).defaultValue = parseFloat(objBeforeGSTAndTax.flBeforeGST - flTotalAmountInvoiced);


        }

        function addColumnsToInvoicesSublist(form, sublist) {
            sublist.addField({
                id: 'custpage_date',
                type: serverWidget.FieldType.TEXT,
                label: 'DATE',
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});

            sublist.addField({
                id: 'custpage_number',
                type: serverWidget.FieldType.TEXT,
                label: 'Number'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});

            sublist.addField({
                id: 'custpage_status',
                type: serverWidget.FieldType.TEXT,
                label: 'Status'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});

            sublist.addField({
                id: 'custpage_amount',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Amount'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});
        }

        function populateInvoicesSublist(newRecord, sublist) {
            // var objByProjectInvoices = getInvoicesByProject(newRecord.getValue('job'));
            var objStandAloneInvoices = getStandAloneInvoices(newRecord.getValue('job'));
            var objBySOInvoices = getInvoicesBySO(newRecord.id);
            var objSOProjects = getSOByProject(newRecord.getValue('job'));
            var objSOTotal = {};
            var count = 0;

            if (newRecord.getValue('job') == "") {
                /** Invoices Linked to SO **/
                for (var intInvoiceIndex in objBySOInvoices) {
                    if (objSOTotal[newRecord.id] == null) {
                        objSOTotal[newRecord.id] = {};
                    }
                    if (objSOTotal[newRecord.id][objBySOInvoices[intInvoiceIndex].internalid] == null) {
                        objSOTotal[newRecord.id][objBySOInvoices[intInvoiceIndex].internalid] = {};
                    }
                    objSOTotal[newRecord.id][objBySOInvoices[intInvoiceIndex].internalid] = objBySOInvoices[intInvoiceIndex];
                }

            } else {
                /** Invoices Linked to SO **/
                for (var intInvoiceIndex in objBySOInvoices) {
                    // var dtSIDate = libHelper.getFormattedDate(objBySOInvoices[intInvoiceIndex].trandate);
                    // for(var intSOIndex in objSOProjects) {
                    //     var dtSODate = libHelper.getFormattedDate(objSOProjects[intSOIndex].trandate);

                    // if(dtSIDate >= dtSODate) {
                    //     var isExist = false;
                    //     for(var intIndexSOTotalIndex in objSOTotal) {
                    //         if(objSOProjects[intSOIndex].internalid != intIndexSOTotalIndex && objSOTotal[intIndexSOTotalIndex][intInvoiceIndex] != null) { isExist = true; }
                    //     }

                    // if(!isExist) {
                    if (objSOTotal[newRecord.id] == null) {
                        objSOTotal[newRecord.id] = {};
                    }
                    if (objSOTotal[newRecord.id][objBySOInvoices[intInvoiceIndex].internalid] == null) {
                        objSOTotal[newRecord.id][objBySOInvoices[intInvoiceIndex].internalid] = {};
                    }
                    objSOTotal[newRecord.id][objBySOInvoices[intInvoiceIndex].internalid] = objBySOInvoices[intInvoiceIndex];
                    // }
                    // }
                    // }
                }

                /** Stand Alone Invoices **/
                for (var intInvoiceIndex in objStandAloneInvoices) {
                    var dtSIDate = libHelper.getFormattedDate(objStandAloneInvoices[intInvoiceIndex].trandate);
                    for (var intSOIndex in objSOProjects) {
                        var dtSODate = libHelper.getFormattedDate(objSOProjects[intSOIndex].trandate);

                        if (dtSIDate >= dtSODate) {
                            var isExist = false;
                            for (var intIndexSOTotalIndex in objSOTotal) {
                                if (objSOProjects[intSOIndex].internalid != intIndexSOTotalIndex && objSOTotal[intIndexSOTotalIndex][intInvoiceIndex] != null) {
                                    isExist = true;
                                }
                            }

                            if (!isExist) {
                                if (objSOTotal[objSOProjects[intSOIndex].internalid] == null) {
                                    objSOTotal[objSOProjects[intSOIndex].internalid] = {};
                                }
                                if (objSOTotal[objSOProjects[intSOIndex].internalid][objStandAloneInvoices[intInvoiceIndex].internalid] == null) {
                                    objSOTotal[objSOProjects[intSOIndex].internalid][objStandAloneInvoices[intInvoiceIndex].internalid] = {};
                                }
                                objSOTotal[objSOProjects[intSOIndex].internalid][objStandAloneInvoices[intInvoiceIndex].internalid] = objStandAloneInvoices[intInvoiceIndex];
                            }
                        }
                    }
                }
            }

            var roleCheck = checkUserRole();

            for (var intIndex in objSOTotal[newRecord.id]) {
                var urlLink = '/app/accounting/transactions/custinvc.nl?id=' + objSOTotal[newRecord.id][intIndex].internalid;
                var stTransId = "<a class='dottedlink' style='text-decoration: none;' href=" + urlLink + ">" + objSOTotal[newRecord.id][intIndex].tranid + "</a>";
                sublist.setSublistValue({
                    id: "custpage_date",
                    line: count,
                    value: objSOTotal[newRecord.id][intIndex].trandate
                });

                if (roleCheck) {
                    sublist.setSublistValue({id: "custpage_number", line: count, value: stTransId});
                } else {
                    sublist.setSublistValue({
                        id: "custpage_number",
                        line: count,
                        value: objSOTotal[newRecord.id][intIndex].tranid
                    });
                }

                sublist.setSublistValue({
                    id: "custpage_status",
                    line: count,
                    value: objSOTotal[newRecord.id][intIndex].status
                });
                sublist.setSublistValue({
                    id: "custpage_amount",
                    line: count,
                    value: objSOTotal[newRecord.id][intIndex].amount
                });
                count++;
            }

        }

        function getInvoiceTotalRemaining(intSOId) {
            var flTotalRemaining = 0;
            if (intSOId != '') {
                var salesorderSearchObj = search.load({id: 'customsearch_sr_amount_remaining_invoice'});
                var filters = salesorderSearchObj.filters;
                filters.push({name: "internalid", operator: "is", values: intSOId.toString()});
                salesorderSearchObj.filters = [];
                salesorderSearchObj.filters = filters;

                var searchResultCount = salesorderSearchObj.runPaged().count;
                if (searchResultCount != 0) {
                    salesorderSearchObj.run().each(function (result) {
                        flTotalRemaining = result.getValue({name: "amountunbilled", summary: "MAX"});
                        return true;
                    });
                }
            }

            return flTotalRemaining;
        }

        function getInvoicesByProject(intProjectId) {
            var arrInvoices = {};
            if (intProjectId == '' || intProjectId == null) {
                return arrInvoices;
            }

            var invoiceSearchObj = search.create({
                type: "invoice",
                filters: [
                    ["mainline", "is", "T"], "AND",
                    ["jobmain.internalid", "anyof", intProjectId]
                ],
                columns: [
                    search.createColumn({name: "trandate", sort: search.Sort.ASC}),
                    search.createColumn({name: "tranid"}),
                    search.createColumn({name: "netamountnotax"}),
                    search.createColumn({name: "status"})
                ]
            });
            var searchResultCount = invoiceSearchObj.runPaged().count;
            if (searchResultCount != 0) {
                invoiceSearchObj.run().each(function (result) {
                    if (arrInvoices[result.id] == null) {
                        arrInvoices[result.id] = {};
                    }
                    arrInvoices[result.id] = {
                        internalid: result.id,
                        trandate: result.getValue({name: "trandate"}),
                        tranid: result.getValue({name: "tranid"}),
                        amount: result.getValue({name: "netamountnotax"}),
                        status: result.getText({name: "status"}),
                    };
                    return true;
                });
            }

            return arrInvoices;
        }

        function getStandAloneInvoices(intProjectId) {
            var arrInvoices = {};

            if (intProjectId == '' || intProjectId == null) {
                return arrInvoices;
            }

            var invoiceSearchObj = search.load({id: 'customsearch_sr_amt_inv_proj_stand_alone'});
            var filters = invoiceSearchObj.filters;
            filters.push({name: "internalid", join: 'jobmain', operator: "anyof", values: intProjectId.toString()});
            invoiceSearchObj.filters = [];
            invoiceSearchObj.filters = filters;

            // var invoiceSearchObj = search.create({
            //     type: "invoice",
            //     filters: [
            //         // ["mainline","is","F"], "AND",
            //         ["createdfrom","anyof","@NONE@"], "AND",
            //         ["accounttype","anyof",["Income","OthIncome"]], "AND",
            //         ["jobmain.internalid","anyof", intProjectId]
            //     ],
            //     columns: [
            //         search.createColumn({name: "trandate", sort: search.Sort.ASC}),
            //         search.createColumn({name: "tranid"}),
            //         search.createColumn({name: "account"}),
            //         search.createColumn({name: "netamountnotax"})
            //     ]
            // });

            var searchResultCount = invoiceSearchObj.runPaged().count;
            if (searchResultCount != 0) {
                invoiceSearchObj.run().each(function (result) {
                    if (arrInvoices[result.id] == null) {
                        arrInvoices[result.id] = {amount: 0};
                    }
                    // var flTaxAmt = (result.getValue({name: "taxtotal"}) == "") ? 0 : parseFloat(result.getValue({name: "taxtotal"}));
                    var flTaxAmt = (result.getValue({name: "taxamount"}) == "") ? 0 : parseFloat(result.getValue({name: "taxamount"}));
                    var flNetAmt = (result.getValue({name: "fxamount"}) == "") ? 0 : parseFloat(result.getValue({name: "fxamount"}));
                    var flTotalNetAmt = parseFloat(parseFloat(flTaxAmt) + parseFloat(flNetAmt));

                    arrInvoices[result.id].internalid = result.id;
                    arrInvoices[result.id].trandate = result.getValue({name: "trandate"});
                    arrInvoices[result.id].tranid = result.getValue({name: "tranid"});
                    arrInvoices[result.id].account = result.getText({name: "account"});
                    arrInvoices[result.id].status = result.getText({name: "statusref"});
                    arrInvoices[result.id].amount = parseFloat(parseFloat(arrInvoices[result.id].amount) + flTotalNetAmt).toFixed(2);
                    return true;
                });
            }

            return arrInvoices;
        }

        function getInvoicesIdBySO(intSalesOrderId) {
            // var arrInvoiceId = [];
            var flTotalAmountPaid = 0;
            if (intSalesOrderId) {
                var invoiceSearchObj = search.load({id: 'customsearch_sr_amt_so_inv_project'});
                var filters = invoiceSearchObj.filters;
                filters.push({name: "createdfrom", operator: "anyof", values: intSalesOrderId.toString()});
                invoiceSearchObj.filters = [];
                invoiceSearchObj.filters = filters;
                var searchResultCount = invoiceSearchObj.runPaged().count;
                if (searchResultCount != 0) {
                    invoiceSearchObj.run().each(function (result) {
                        // arrInvoiceId.push(result.id);
                        var flTaxAmt = (result.getValue({name: "taxtotal"}) == "") ? 0 : parseFloat(result.getValue({name: "taxtotal"}));
                        var flNetAmt = (result.getValue({name: "fxamount"}) == "") ? 0 : parseFloat(result.getValue({name: "fxamount"}));
                        var flTotalNetAmt = parseFloat(parseFloat(flTaxAmt) + parseFloat(flNetAmt));
                        flTotalAmountPaid += parseFloat(flTotalNetAmt);
                        return true;
                    });
                }
            }

            return flTotalAmountPaid;
        }

        function getInvoicesBySO(intSalesOrderId) {
            var arrInvoices = {};

            var invoiceSearchObj = search.load({id: 'customsearch_sr_amt_so_inv_project'});
            var filters = invoiceSearchObj.filters;
            filters.push({name: "createdfrom", operator: "anyof", values: intSalesOrderId.toString()});
            invoiceSearchObj.filters = [];
            invoiceSearchObj.filters = filters;

            var searchResultCount = invoiceSearchObj.runPaged().count;

            if (searchResultCount != 0) {
                invoiceSearchObj.run().each(function (result) {
                    if (arrInvoices[result.id] == null) {
                        arrInvoices[result.id] = {amount: 0};
                    }
                    var flTaxAmt = (result.getValue({name: "taxtotal"}) == "") ? 0 : parseFloat(result.getValue({name: "taxtotal"}));
                    var flNetAmt = (result.getValue({name: "fxamount"}) == "") ? 0 : parseFloat(result.getValue({name: "fxamount"}));
                    var flTotalNetAmt = parseFloat(parseFloat(flTaxAmt) + parseFloat(flNetAmt));
                    arrInvoices[result.id].internalid = result.id;
                    arrInvoices[result.id].trandate = result.getValue({name: "trandate"});
                    arrInvoices[result.id].tranid = result.getValue({name: "tranid"});
                    arrInvoices[result.id].account = result.getText({name: "account"});
                    arrInvoices[result.id].status = result.getText({name: "statusref"});
                    arrInvoices[result.id].amount = parseFloat(parseFloat(arrInvoices[result.id].amount) + flTotalNetAmt).toFixed(2);
                    return true;
                });
            }

            return arrInvoices;
        }

        function getSOByProject(intProjectId) {
            var arrSalesOrders = [];

            if (intProjectId == '' || intProjectId == null) {
                return arrSalesOrders;
            }

            var salesorderSearchObj = search.create({
                type: "salesorder",
                filters: [
                    ["mainline", "is", "T"], "AND",
                    ["jobmain.internalid", "anyof", intProjectId]
                ],
                columns: [
                    search.createColumn({name: "trandate", sort: search.Sort.DESC}),
                    search.createColumn({name: "tranid"}),
                    search.createColumn({name: "amount"}),
                    search.createColumn({name: "status"})
                ]
            });
            var searchResultCount = salesorderSearchObj.runPaged().count;
            if (searchResultCount != 0) {
                salesorderSearchObj.run().each(function (result) {
                    arrSalesOrders.push({
                        internalid: result.id,
                        trandate: result.getValue({name: "trandate"}),
                        tranid: result.getValue({name: "tranid"}),
                        amount: result.getValue({name: "amount"}),
                        status: result.getValue({name: "statusref"}),
                    });
                    return true;
                });
            }

            return arrSalesOrders;
        }

        function getSOBeforeGSTAndTax(intSOId) {
            var objData = {flBeforeGST: 0, flTax: 0};
            if (intSOId != '') {
                var salesorderSearchObj = search.load({id: 'customsearch_sr_amt_so_beforegst_tax'});
                var filters = salesorderSearchObj.filters;
                filters.push({name: "internalid", operator: "is", values: intSOId.toString()});
                salesorderSearchObj.filters = [];
                salesorderSearchObj.filters = filters;
                var searchResultCount = salesorderSearchObj.runPaged().count;

                if (searchResultCount != 0) {
                    salesorderSearchObj.run().each(function (result) {
                        // var stBeforeGST = result.getValue({name: "recognizedrevenue", summary: "SUM"});
                        var stBeforeGST = result.getValue({name: "fxamount", summary: "SUM"});
                        var stTax = result.getValue({name: "taxamount", summary: "SUM"});
                        objData.flBeforeGST = (stBeforeGST == '') ? 0 : parseFloat(stBeforeGST);
                        objData.flTax = (stTax == '') ? 0 : parseFloat(stTax);
                        return true;
                    });
                }
            }

            return objData;
        }

        //original getInvoiceamount
        function getInvoicedAmount(intSOId) {
            var flInvoicedAmount = 0;
            if (intSOId != '') {
                var salesorderSearchObj = search.load({id: 'customsearch_sr_amount_invoiced_project'});
                var filters = salesorderSearchObj.filters;
                filters.push({name: "internalid", operator: "is", values: intSOId.toString()});
                salesorderSearchObj.filters = [];
                salesorderSearchObj.filters = filters;
                var searchResultCount = salesorderSearchObj.runPaged().count;

                if (searchResultCount != 0) {
                    salesorderSearchObj.run().each(function (result) {
                        var stNetAmt = result.getValue({
                            name: "netamountnotax",
                            join: "billingTransaction",
                            summary: "SUM",
                            sort: search.Sort.ASC
                        });
                        flInvoicedAmount = (stNetAmt == '') ? 0 : parseFloat(stNetAmt);
                        return true;
                    });
                }
            }

            return flInvoicedAmount;
        }

        //new getInvoiceamount

        function getInvoiceAmountPaid(arrInvoiceId) {
            var flInvoicedAmount = 0;
            if (arrInvoiceId.length != 0) {
                var salesorderSearchObj = search.load({id: 'customsearch_sr_amountpaid_invoice'});
                var filters = salesorderSearchObj.filters;
                filters.push({name: "internalid", operator: "anyof", values: arrInvoiceId});
                salesorderSearchObj.filters = [];
                salesorderSearchObj.filters = filters;
                var searchResultCount = salesorderSearchObj.runPaged().count;

                if (searchResultCount != 0) {
                    salesorderSearchObj.run().each(function (result) {
                        var stNetAmt = result.getValue({name: "amountpaid", summary: "SUM", sort: search.Sort.ASC});

                        log.debug('stNetAmt', parseFloat(stNetAmt));

                        flInvoicedAmount += (stNetAmt == '') ? 0 : parseFloat(stNetAmt);
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
            for (var intInvoiceIndex in objInvoices) {
                // var dtSIDate = libHelper.getFormattedDate(objInvoices[intInvoiceIndex].trandate);
                // for(var intSOIndex in objSOProjects) {
                //     var dtSODate = libHelper.getFormattedDate(objSOProjects[intSOIndex].trandate);

                // if(dtSIDate >= dtSODate) {
                //     var isExist = false;
                //     for(var intIndexSOTotalIndex in objSOTotal) {
                //         if(objSOProjects[intSOIndex].internalid != intIndexSOTotalIndex && objSOTotal[intIndexSOTotalIndex][intInvoiceIndex] != null) { isExist = true; }
                //     }
                //
                //     if(!isExist) {
                if (objSOTotal[intSalesOrderId] == null) {
                    objSOTotal[intSalesOrderId] = {};
                }
                if (objSOTotal[intSalesOrderId][objInvoices[intInvoiceIndex].internalid] == null) {
                    objSOTotal[intSalesOrderId][objInvoices[intInvoiceIndex].internalid] = {};
                }
                objSOTotal[intSalesOrderId][objInvoices[intInvoiceIndex].internalid] = objInvoices[intInvoiceIndex];
                // }
                // }
                // }
            }

            /** Stand Alone Invoices **/
            for (var intInvoiceIndex in objStandAloneInvoices) {
                var dtSIDate = libHelper.getFormattedDate(objStandAloneInvoices[intInvoiceIndex].trandate);
                for (var intSOIndex in objSOProjects) {
                    var dtSODate = libHelper.getFormattedDate(objSOProjects[intSOIndex].trandate);

                    if (dtSIDate >= dtSODate) {
                        var isExist = false;
                        for (var intIndexSOTotalIndex in objSOTotal) {
                            if (objSOProjects[intSOIndex].internalid != intIndexSOTotalIndex && objSOTotal[intIndexSOTotalIndex][intInvoiceIndex] != null) {
                                isExist = true;
                            }
                        }

                        if (!isExist) {
                            if (objSOTotal[objSOProjects[intSOIndex].internalid] == null) {
                                objSOTotal[objSOProjects[intSOIndex].internalid] = {};
                            }
                            if (objSOTotal[objSOProjects[intSOIndex].internalid][objStandAloneInvoices[intInvoiceIndex].internalid] == null) {
                                objSOTotal[objSOProjects[intSOIndex].internalid][objStandAloneInvoices[intInvoiceIndex].internalid] = {};
                            }
                            objSOTotal[objSOProjects[intSOIndex].internalid][objStandAloneInvoices[intInvoiceIndex].internalid] = objStandAloneInvoices[intInvoiceIndex];
                        }
                    }
                }
            }

            for (var intIndex in objSOTotal[intSalesOrderId]) {
                flAmount = parseFloat(parseFloat(flAmount) + parseFloat(objSOTotal[intSalesOrderId][intIndex].amount)).toFixed(2);
            }

            return flAmount;
        }

        function checkUserRole() {
            try {
                var userRole = runtime.getCurrentUser().role;
                var flag = true;
                if (!isInArray(userRole, allowedRoles)) {
                    flag = false;
                }
            } catch (e) {
                log.debug('error in checkUserRole()', e);
            }
            return flag;
        }

        function isInArray(value, array) {
            return array.indexOf(value) > -1;
        }

        function taxAmountInvoice(inJob) {
            var obj = {};
            if (inJob == '' || inJob == null) {
                return obj;
            }
            var invoiceSearchObj = search.load({id: 'customsearch_sr_for_tax_amount'});
            var filters = invoiceSearchObj.filters;
            filters.push({name: "internalid", join: 'jobmain', operator: "anyof", values: inJob.toString()});
            invoiceSearchObj.filters = [];
            invoiceSearchObj.filters = filters;

            var searchResultCount = invoiceSearchObj.runPaged().count;
            if (searchResultCount != 0) {
                invoiceSearchObj.run().each(function (result) {
                    var inTaxAmt = parseFloat(result.getValue({name: "taxamount", summary: "SUM"}));

                    obj = {
                        inTaxAmount: inTaxAmt
                    };

                    return true;
                });
            }

            return obj;
        }

        function getInvoiceRecordBySalesOrder(inSalesOrdeId) {
            var objInvoices = {};

            var invoiceSearchObj = search.load({id: 'customsearch_sr_so_with_invoices'});
            var filters = invoiceSearchObj.filters;
            filters.push({name: "createdfrom", operator: "anyof", values: inSalesOrdeId.toString()});
            invoiceSearchObj.filters = [];
            invoiceSearchObj.filters = filters;

            var searchResultCount = invoiceSearchObj.runPaged().count;

            if (searchResultCount != 0) {
                invoiceSearchObj.run().each(function (result) {
                    if (objInvoices[result.id] == null) {
                        objInvoices[result.getValue({name: 'internalid', summary: 'GROUP'})] = {
                            inAmount: Number(result.getValue({name: 'amount', summary: 'SUM'})),
                            inTaxAmount: Number(result.getValue({name: 'taxamount', summary: 'SUM'}))
                        };
                    }
                    return true;
                });
            }

            return objInvoices;
        }

        function getStandAloneInvoiceRecord(inProjectId) {
            var objInvoices = {};
            log.debug('inProjectId', inProjectId);
            var invoiceSearchObj = search.load({id: 'customsearch_sr_stand_alone_invoices'});
            var filters = invoiceSearchObj.filters;
            filters.push({name: "internalid", join: 'jobmain', operator: "anyof", values: inProjectId.toString()});
            invoiceSearchObj.filters = [];
            invoiceSearchObj.filters = filters;

            var searchResultCount = invoiceSearchObj.runPaged().count;
            if (searchResultCount != 0) {
                invoiceSearchObj.run().each(function (result) {
                    if (objInvoices[result.id] == null) {
                        objInvoices[result.getValue({name: 'internalid', summary: 'GROUP'})] = {
                            inAmount: Number(result.getValue({name: 'amount', summary: 'SUM'})),
                            inTaxAmount: Number(result.getValue({name: 'taxamount', summary: 'SUM'}))
                        };
                    }
                    return true;
                });
            }

            return objInvoices;
        }


        return {
            beforeLoad: beforeLoad,
            afterSubmit: afterSubmit
        };

    });