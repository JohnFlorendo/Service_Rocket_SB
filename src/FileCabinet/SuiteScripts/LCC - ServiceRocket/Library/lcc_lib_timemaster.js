define(['N/runtime', 'N/record', 'N/search', 'N/url', 'N/currency', 'N/format', 'N/runtime'],
    /**
     * @param{record} record
     * @param{search} search
     * @param{runtime} runtime
     */
    function (runtime, record, search, url, currency, format, runtime) {
        var STATUS_APPROVED = 3;
        var fn = {};
        const Time_and_Materials_Postpaid_Monthly = 10;
        const Time_and_Materials_Postpaid_Semi_Monthly = 13;
        const Fixed_Date = -10;
        const Milestone = -12;
        const Time_Based = -13;
        var USD_ID = 1;
        var userObj = runtime.getCurrentUser();
        var stDatePreference = userObj.getPreference({name: "dateformat"});

        fn.SAVE_SEARCH = {
            INVOICE_PER_PROJECT: "customsearch_inv_per_project", //Customer Invoice Search per Project
            INVOICE_HOURLY_RATE: "customsearch_sr_hourly_rate_inv" //**Do not Modify - Invoiced Hourly Rate
        };

        fn.TIME_MASTER = {
            TYPE: 'customrecord_sr_time_master',
            NAME: 'altname',
            CHARGE: 'custrecord_sr_charge_record',
            TIME: 'custrecord_sr_time_entry',
            PROJECT: 'custrecord_tm_project',
            LINK: 'custrecord_sr_charge_link',
            SALES_ORDER: 'custrecord_sr_charge_salesorder',
            INVOICE: 'custrecord_time_charge_invoice',
            TIME_EMPLOYEE: 'custrecord_time_employee',
            DURATION: 'custrecord_sr_duration_decimal',
            IS_BILLABLE: 'custrecord_sr_time_billable',
            IS_FIXED_PRICE: 'custrecord_sr_is_fixed_price',
            IS_INVOICED: 'custrecord_sr_is_invoiced',
            IS_LEARNING: 'custrecord_sr_is_learning',
            IS_PAID: 'custrecord_sr_is_paid',
            IS_PMO: 'custrecord_sr_is_pmo',
            IS_PREPAID: 'custrecord_sr_is_prepaid',
            IS_TIMEOFF: 'custrecord_sr_is_timeoff',
            IS_WRITEOFF: 'custrecord_sr_is_writeoff',
            RATE_PER_HOUR_ORIG: 'custrecord_sr_proj_hourly_rate_origfx',
            SERVICE_ITEM: 'custrecord_sr_so_service_item',
            USD_RATE_PER_HOUR: 'custrecord_sr_proj_hourly_rate_usd',
            RATE_ORIG_CURRENCY: 'custrecord_sr_proj_orig_currency',
            CUSTOMER_INVOICE: 'custrecord_sr_customer_invoice',
            CALCULATED_REVENUE: 'custrecord_sr_calculated_revenue',
            QUANTITY_BILLED: 'custrecord_sr_quantity_billed',
            INVOICE_ORIGINAL_CURRENCY: 'custrecord_sr_invoice_original_currency',
            INVOICE_HOURLY_RATE_ORIG_CURRENCY_OVERRIDE: 'custrecord_sr_inv_rate_origfx_override',
            INVOICE_USD_HOURLY_RATE_OVERRIDE: 'custrecord_sr_inv_projrate_usd_override',
            INVOICE_USD_RATE_PER_HOUR: 'custrecord_sr_invoiced_rate_usd',
            INVOICE_HOURLY_RATE_ORIG_CURRENCY: 'custrecord_sr_inv_rate_orig_currency',
            SO_PROJECT_RATE_PER_HOUR_OVERRIDE: 'custrecord_sr_hourly_rate_override',
            IS_MULTIPLE_INVOICE: "custrecordsr_multiple_invoice"
        };

        fn.CLEAR_TIME_MASTER_FIELDS = {
            LINK: 'custrecord_sr_charge_link',
            SALES_ORDER: 'custrecord_sr_charge_salesorder',
            INVOICE: 'custrecord_time_charge_invoice',
            RATE_PER_HOUR_ORIG: 'custrecord_sr_proj_hourly_rate_origfx',
            SERVICE_ITEM: 'custrecord_sr_so_service_item',
            USD_RATE_PER_HOUR: 'custrecord_sr_proj_hourly_rate_usd',
            RATE_ORIG_CURRENCY: 'custrecord_sr_proj_orig_currency'
        };

        fn.searchTimeMaster = function (stTimeId) {
            var stTimeMasterId = null;

            try {
                var objSearch = search.create({
                    type: "customrecord_sr_time_master",
                    filters:
                        [
                            ["custrecord_sr_time_entry", "anyof", stTimeId]
                        ],
                    columns:
                        [
                            "custrecord_sr_charge_record",
                            "custrecord_sr_charge_link",
                            "custrecord_sr_time_entry"
                        ]
                });
                var searchResults = objSearch.run().getRange({
                    start: 0,
                    end: 1
                });

                if (searchResults.length > 0) {
                    stTimeMasterId = searchResults[0].id;
                }

            } catch (e) {
                log.debug('fn.searchTimeMaster', e);
            }
            return stTimeMasterId;
        }

        fn.getTimeEntries = function () {

            var arrTimes = [];
            try {
                var timebillSearchObj = search.create({
                    type: "timebill",
                    filters:
                        [
                            ["type", "anyof", "A"]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "date",
                                sort: search.Sort.ASC
                            }),
                            "employee",
                            "customer",
                            "item",
                            "hours",
                            "type",
                            "approvalstatus",
                            "timesheet",
                            "isbillable",
                            "approvalstatus",
                            "supervisorapproval",
                            "timeofftype"
                        ]
                });
                var searchResultCount = timebillSearchObj.runPaged().count;
                // log.debug("timebillSearchObj result count",searchResultCount);
                timebillSearchObj.run().each(function (result) {
                    var objTimes = {
                        'id': result.id,
                        'name': result.getText('employee'),
                        'date': result.getValue('date'),
                        'hours': result.getValue('hours'),
                    }
                    arrTimes.push(objTimes);
                    return true;
                });
            } catch (e) {
                log.debug('fn.getTimeEntries', e);
            }
            return arrTimes;
        }

        fn.getChargeByTimeId = function (timeId) {
            var stChargeId = null;

            if (timeId) {
                try {

                    var objSearch = search.create({
                        type: "charge",
                        filters:
                            [
                                ["time.internalid", "anyof", timeId],
                                "AND",
                                ["use", "anyof", "Actual"]
                            ],
                        columns:
                            [
                                "internalid",
                                "id",
                                "chargetype"
                            ]
                    });
                    var searchResults = objSearch.run().getRange({
                        start: 0,
                        end: 1
                    });

                    if (searchResults.length > 0) {
                        stChargeId = searchResults[0].id;
                    }
                } catch (e) {
                    log.debug('fn.getChargeByTimeId', e);
                }
            }

            return stChargeId;
        }

        fn.getTransactionByCharge = function (chargeId) {
            var objTrans = {};
            objTrans.salesOrder = '';
            objTrans.invoice = '';
            if (chargeId) {
                try {
                    var chargeSearchObj = search.create({
                        type: "charge",
                        filters:
                            [
                                ["internalid", "anyof", chargeId]
                            ],
                        columns:
                            [
                                search.createColumn({name: "salesorder", label: "Sales Order Id"}),
                                search.createColumn({
                                    name: "tranid",
                                    join: "invoice",
                                    label: "Document Number"
                                }),
                                search.createColumn({
                                    name: "internalid",
                                    join: "invoice",
                                    label: "Internal ID"
                                })
                            ]
                    });
                    var searchResults = chargeSearchObj.run().getRange({
                        start: 0,
                        end: 1
                    });

                    if (searchResults.length > 0) {
                        objTrans.salesOrder = searchResults[0].getValue('salesorder');
                        objTrans.invoice = searchResults[0].getValue({
                            name: 'internalid',
                            join: 'invoice'
                        });
                    }

                } catch (e) {
                    log.debug('getTransactionByCharge', e);
                }
                // log.debug('objTrans',objTrans);
            }

            return objTrans;
        }

        fn.calculateSumAndDivideByTimeBasedLine = function (inSalesOrderId, inItem) {
            var objSOProjectRates = {};

            objSOProjectRates.ratePerHourOrig = '';
            objSOProjectRates.serviceItem = '';
            objSOProjectRates.usdRatePerHour = '';
            objSOProjectRates.rateOrigCurrency = '';

            if (inSalesOrderId) {
                try {
                    var recSalesOrder = record.load({
                        type: 'salesorder',
                        id: inSalesOrderId,
                        isDynamic: true
                    });

                    var objResults = fn.searchSOLineValues(inSalesOrderId);

                    var inTotalCurrencyAmount = 0;
                    var inTotalAmount = 0;
                    var inTotalQuantity = 0;

                    var inCount = recSalesOrder.getLineCount({
                        sublistId: 'item'
                    });

                    for (var indxItem = 0; indxItem < inCount; indxItem++) {
                        var inLineBillingSchedule = recSalesOrder.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'billingschedule',
                            line: indxItem
                        });
                        var inLineChargeType = recSalesOrder.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'chargetype',
                            line: indxItem
                        });
                        var inLineId = recSalesOrder.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'line',
                            line: indxItem
                        });
                        var inLineItem = recSalesOrder.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: indxItem
                        });

                        if ((inLineBillingSchedule == Time_and_Materials_Postpaid_Monthly || inLineBillingSchedule == Time_and_Materials_Postpaid_Semi_Monthly) && inLineItem == inItem) {
                            inTotalCurrencyAmount += Number(objResults[inLineId].lineCurrencyAmount);
                            inTotalAmount += Number(objResults[inLineId].lineAmount);
                        } else if ((inLineBillingSchedule != Time_and_Materials_Postpaid_Monthly || inLineBillingSchedule != Time_and_Materials_Postpaid_Semi_Monthly) && inLineChargeType == Fixed_Date && inLineItem == inItem) {
                            inTotalCurrencyAmount += Number(objResults[inLineId].lineCurrencyAmount);
                            inTotalAmount += Number(objResults[inLineId].lineAmount);
                        } else if ((inLineBillingSchedule != Time_and_Materials_Postpaid_Monthly || inLineBillingSchedule != Time_and_Materials_Postpaid_Semi_Monthly) && inLineChargeType == Milestone && inLineItem == inItem) {
                            inTotalCurrencyAmount += Number(objResults[inLineId].lineCurrencyAmount);
                            inTotalAmount += Number(objResults[inLineId].lineAmount);
                        }

                        if (inLineChargeType == Time_Based && inLineItem == inItem) {
                            var inLineQuantity = recSalesOrder.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                line: indxItem
                            });

                            inTotalQuantity += inLineQuantity;
                        }

                    }

                    objSOProjectRates.rateOrigCurrency = objResults[Object.keys(objResults)[0]].lineCurrency;

                    if (objSOProjectRates.rateOrigCurrency) {
                        if (objSOProjectRates.rateOrigCurrency == '1') {
                            objSOProjectRates.ratePerHourOrig = inTotalCurrencyAmount / inTotalQuantity;
                            objSOProjectRates.usdRatePerHour = inTotalCurrencyAmount / inTotalQuantity;
                        } else {
                            objSOProjectRates.ratePerHourOrig = inTotalCurrencyAmount / inTotalQuantity;
                            objSOProjectRates.usdRatePerHour = inTotalAmount / inTotalQuantity;
                        }
                    }

                    objSOProjectRates.serviceItem = inItem;

                } catch (e) {
                    log.debug('error: calculateSumAndDivideByTimeBasedLine', e)
                }
                // log.debug('objSOProjectRates', objSOProjectRates);
            }
            return objSOProjectRates;
        }

        fn.searchSOLineValues = function (inSalesOrderId) {
            var objResults = {};

            var searchSOTransaction = search.create({
                type: "salesorder",
                filters:
                    [
                        ["type", "anyof", "SalesOrd"],
                        "AND",
                        ["taxline", "is", "F"],
                        "AND",
                        ["shipping", "is", "F"],
                        "AND",
                        ["mainline", "is", "F"],
                        "AND",
                        ["internalid", "anyof", inSalesOrderId]
                    ],
                columns:
                    [
                        search.createColumn({name: "line", label: "Line ID"}),
                        search.createColumn({name: "amount", label: "Amount"}),
                        search.createColumn({name: "fxamount", label: "Amount (Foreign Currency)"}),
                        search.createColumn({name: "currency", label: "Currency"}),
                        search.createColumn({name: "quantity", label: "Quantity"}),
                    ]
            });
            searchSOTransaction.run().each(function (result) {
                var inLine = result.getValue({
                    name: 'line'
                });
                var inAmount = result.getValue({
                    name: 'amount'
                });
                var inCurrencyAmount = result.getValue({
                    name: 'fxamount'
                });
                var inQuantity = result.getValue({
                    name: 'quantity'
                });
                var inCurrency = result.getValue({
                    name: 'currency'
                });

                objResults[inLine] = {
                    lineAmount: inAmount,
                    lineCurrencyAmount: inCurrencyAmount,
                    lineCurrency: inCurrency,
                    lineQuantity: inQuantity
                }

                return true;
            });
            // log.debug('objResults', objResults);
            return objResults
        }

        fn.attachCharge = function (timeMasterId, chargeId, chargeTransactions) {

            //start added by Patrick
            var recTimeMaster = record.load({type: fn.TIME_MASTER.TYPE, id: timeMasterId, isDynamic: true});
            var recTimeEntry = record.load({
                type: record.Type.TIME_BILL,
                id: recTimeMaster.getValue({fieldId: 'custrecord_sr_time_entry'}),
                isDynamic: true
            });
            var idProject = (recTimeEntry.getValue({fieldId: 'customer'})) ? recTimeEntry.getValue({fieldId: 'customer'}) : null;
            //end
            record.submitFields({
                type: 'customrecord_sr_time_master',
                id: timeMasterId,
                values: {
                    custrecord_sr_charge_salesorder: (chargeTransactions.salesOrder) ? chargeTransactions.salesOrder : null,
                    custrecord_time_charge_invoice: (chargeTransactions.invoice) ? chargeTransactions.invoice : null,
                    custrecord_sr_charge_record: chargeId,
                    custrecord_sr_charge_link: fn.resolveChargeUrl(chargeId),
                    custrecord_tm_project: idProject
                }
            });
        }

        fn.getTimeMasterRecordsByTimeId = function (timeBillId) {
            var timeMasterId = 0;

            var columns = [
                'internalid',
                'custrecord_sr_time_entry',
                'custrecord_sr_charge_record',
                'custrecord_sr_charge_link',
            ];

            search.create({
                type: 'customrecord_sr_time_master',
                columns: columns,
                filters: [{
                    name: 'custrecord_sr_time_entry',
                    operator: 'anyof',
                    values: [timeBillId]
                }]
            })
                .run()
                .each(function (result) {
                    timeMasterId = result.id
                    // return true;
                });

            // log.debug('TIME MASTER RECORD', timeMasterRecords)
            return timeMasterId;
        }

        fn.resolveChargeUrl = function (chargeId) {
            return fn.resolveUrl({
                accountId: runtime.accountId,
                recordId: chargeId,
                recordType: 'charge'
            });
        }

        fn.resolveUrl = function (options) {
            var scheme = 'https://';
            var host = url.resolveDomain({
                hostType: url.HostType.APPLICATION,
                accountId: options.accountId
            });

            var relativePath = url.resolveRecord({
                recordType: options.recordType,
                recordId: options.recordId,
                isEditMode: false
            });

            var eventUrl = scheme + host + '/' + relativePath;
            return eventUrl;
        }

        fn.searchTimeMasterBySalesOrderCharge = function (stSalesOrderId) {

            var arrResults = [];
            try {
                var customrecord_sr_time_masterSearchObj = search.create({
                    type: "customrecord_sr_time_master",
                    filters:
                        [
                            ["custrecord_sr_charge_salesorder.internalid", "anyof", stSalesOrderId]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "internalid",
                                summary: "GROUP"
                            })
                        ]
                });
                customrecord_sr_time_masterSearchObj.run().each(function (result) {
                    arrResults.push(result.getValue({
                        name: "internalid",
                        summary: "GROUP"
                    }));
                    return true;
                });

            } catch (e) {
                log.debug('searchTimeMasterBySalesOrderCharge', e);
            }

            return arrResults;
        }

        fn.createTimeMaster = function (timeBillId, chargeId) {
            try {

                var recTimeMasterRecord = record.create({
                    type: fn.TIME_MASTER.TYPE,
                    isDynamic: true
                });

                //start added by Patrick
                var objTimeEntryFields = fn.getTimeEntryDetails(timeBillId);

                var inChargeId = fn.getChargeByTimeId(timeBillId);
                var objTransactionByCharge = fn.getTransactionByCharge(inChargeId);
                var stProjectFields = fn.getProjectFields(objTimeEntryFields.inProject);
                var objSalesOrderProjectRates = fn.calculateSumAndDivideByTimeBasedLine(objTransactionByCharge.salesOrder, objTimeEntryFields.inItem);

                fn.setTimeEntry(recTimeMasterRecord, timeBillId);
                fn.setSalesOrder(recTimeMasterRecord, objTransactionByCharge.salesOrder);
                fn.setProject(recTimeMasterRecord, objTimeEntryFields.inProject);
                fn.setChargeLink(recTimeMasterRecord, chargeId);
                fn.setDuration(recTimeMasterRecord, objTimeEntryFields.stDuration);
                fn.setBillable(recTimeMasterRecord, objTimeEntryFields.isBillable);
                // fn.setIsFixPrice(recTimeMasterRecord,stProjectFields.name);
                fn.setIsFixPrice(recTimeMasterRecord, stProjectFields.billingSchedule);
                fn.setIsInvoice(recTimeMasterRecord, objTransactionByCharge.invoice);
                fn.setIsLearning(recTimeMasterRecord, stProjectFields.name);
                fn.setIsPaid(recTimeMasterRecord, objTransactionByCharge.invoice);
                fn.setIsPMO(recTimeMasterRecord, stProjectFields.projectType);
                fn.setIsPrePaid(recTimeMasterRecord, stProjectFields.billingSchedule);
                fn.setIsTimeOff(recTimeMasterRecord, objTimeEntryFields.stTimeOffType);
                fn.setIsWriteOff(recTimeMasterRecord, objTimeEntryFields.isUtilized, objTimeEntryFields.inApprovalStatus, objTimeEntryFields.isBillable);
                fn.setTimeEmployee(recTimeMasterRecord, objTimeEntryFields.inEmployee);
                fn.setName(recTimeMasterRecord, timeBillId, objTimeEntryFields.stEmployee);
                fn.setRatePerHourOrig(recTimeMasterRecord, objSalesOrderProjectRates);
                fn.setServiceItem(recTimeMasterRecord, objSalesOrderProjectRates);
                fn.setUSDRatePerHour(recTimeMasterRecord, objSalesOrderProjectRates);
                fn.setOrigCurrency(recTimeMasterRecord, objSalesOrderProjectRates);
                fn.checkDummyInvoice(recTimeMasterRecord, stProjectFields);
                //end

                var id = recTimeMasterRecord.save();
                log.debug('CREATED TIME MASTER ID', id);
            } catch (e) {
                log.debug('fn.createTimeMaster', e);
            }
        }

        fn.updateTimeMaster = function (inTimeMaster, timeBillId) {
            log.debug('updateTimeMaster');
            try {

                if (inTimeMaster) {
                    var recTimeMasterRecord = record.load({
                        type: fn.TIME_MASTER.TYPE,
                        id: inTimeMaster,
                        isDynamic: true
                    });

                    //start added by Patrick
                    var objTimeEntryFields = fn.getTimeEntryDetails(timeBillId);
                    var inChargeId = fn.getChargeByTimeId(timeBillId);
                    clearTimeMasterFields(recTimeMasterRecord, inChargeId);
                    var objTransactionByCharge = fn.getTransactionByCharge(inChargeId);
                    var stProjectFields = fn.getProjectFields(objTimeEntryFields.inProject);
                    var objSalesOrderProjectRates = fn.calculateSumAndDivideByTimeBasedLine(objTransactionByCharge.salesOrder, objTimeEntryFields.inItem);

                    //recTimeMasterRecord = fn.clearAllFields(recTimeMasterRecord);

                    fn.setTimeEntry(recTimeMasterRecord, timeBillId);
                    fn.setSalesOrder(recTimeMasterRecord, objTransactionByCharge.salesOrder);
                    fn.setProject(recTimeMasterRecord, objTimeEntryFields.inProject);
                    fn.setChargeLink(recTimeMasterRecord, inChargeId);
                    fn.setDuration(recTimeMasterRecord, objTimeEntryFields.stDuration);
                    fn.setBillable(recTimeMasterRecord, objTimeEntryFields.isBillable);
                    // fn.setIsFixPrice(recTimeMasterRecord,stProjectFields.name);
                    fn.setIsFixPrice(recTimeMasterRecord, stProjectFields.billingSchedule);
                    fn.setIsInvoice(recTimeMasterRecord, objTransactionByCharge.invoice);
                    fn.setIsLearning(recTimeMasterRecord, stProjectFields.name);
                    fn.setIsPaid(recTimeMasterRecord, objTransactionByCharge.invoice);
                    fn.setIsPMO(recTimeMasterRecord, stProjectFields.projectType);
                    fn.setIsPrePaid(recTimeMasterRecord, stProjectFields.billingSchedule);
                    fn.setIsTimeOff(recTimeMasterRecord, objTimeEntryFields.stTimeOffType);
                    fn.setIsWriteOff(recTimeMasterRecord, objTimeEntryFields.isUtilized, objTimeEntryFields.inApprovalStatus, objTimeEntryFields.isBillable);
                    fn.setTimeEmployee(recTimeMasterRecord, objTimeEntryFields.inEmployee);
                    fn.setName(recTimeMasterRecord, timeBillId, objTimeEntryFields.stEmployee);
                    fn.setRatePerHourOrig(recTimeMasterRecord, objSalesOrderProjectRates);
                    fn.setServiceItem(recTimeMasterRecord, objSalesOrderProjectRates);
                    fn.setUSDRatePerHour(recTimeMasterRecord, objSalesOrderProjectRates);
                    fn.setOrigCurrency(recTimeMasterRecord, objSalesOrderProjectRates);
                    fn.checkDummyInvoice(recTimeMasterRecord, stProjectFields);

                    //end
                    var id = recTimeMasterRecord.save();
                    log.debug('updateTimeMaster : TIME MASTER ID', id);

                }

            } catch (e) {
                log.debug('fn.updateTimeMaster', e);
            }
        }

        function clearTimeMasterFields(recTimeMasterRecord, inChargeId) {
            // log.debug('recTimeMasterRecord', recTimeMasterRecord);
            // log.debug('inChargeId', inChargeId);
            if (!inChargeId) {
                for (var stFieldName in fn.CLEAR_TIME_MASTER_FIELDS) {
                    recTimeMasterRecord.setValue({
                        fieldId: fn.CLEAR_TIME_MASTER_FIELDS[stFieldName],
                        value: ''
                    });
                }
            }
        }

        fn.checkDummyInvoice = function (recObject, objProjectFields) {
            var stChargeInvoice = recObject.getText({fieldId: fn.TIME_MASTER.INVOICE});
            if (stChargeInvoice) {
                var objHourlyRateLocalCurrency = {};
                var isDummy = stChargeInvoice.indexOf("-"); //Invoices with dash(-) are considered dummy

                var chargeLookupField = search.lookupFields({
                    type: "charge",
                    id: recObject.getValue(fn.TIME_MASTER.CHARGE),
                    columns: ['quantity', 'billingschedule', 'chargetype']
                });
                log.debug('chargeLookupField', chargeLookupField);

                recObject.setValue(fn.TIME_MASTER.QUANTITY_BILLED, chargeLookupField.quantity);

                if (isDummy != -1) {
                    // var objInvoiceProject = fn.getInvoiceProject(recObject);
                    var objInvoiceProject = fn.getActualInvoice(recObject);
                    log.debug('objInvoiceProject', objInvoiceProject);
                    if (objInvoiceProject.intInvoiceId) {
                        recObject.setValue({
                            fieldId: fn.TIME_MASTER.CUSTOMER_INVOICE,
                            value: objInvoiceProject.intInvoiceId
                        });
                        var objChargeInvoiceData = fn.getInvoiceDetails(recObject.getValue({fieldId: fn.TIME_MASTER.INVOICE}));
                        var objCustomerInvoiceData = fn.getInvoiceDetails(objInvoiceProject.intInvoiceId);
                        log.debug('objCustomerInvoiceData', objCustomerInvoiceData);
                        log.debug('objCustomerInvoiceData.fxrate', objCustomerInvoiceData.fxrate);
                        log.debug('objChargeInvoiceData.quantityuom', objChargeInvoiceData.quantityuom);

                        log.debug('flRate manual', Number(objCustomerInvoiceData.fxrate) / Number(objChargeInvoiceData.quantityuom));
                        var flRate = parseFloat(parseFloat(objCustomerInvoiceData.fxrate) / parseFloat(objChargeInvoiceData.quantityuom));
                        log.debug('flRate', flRate);
                        objHourlyRateLocalCurrency = {
                            trandate: objCustomerInvoiceData.trandate,
                            currency: objCustomerInvoiceData.currency,
                            currencysymbol: objCustomerInvoiceData.currencysymbol,
                            item: objCustomerInvoiceData.item,
                            fxrate: flRate,
                            quantitybilled: objChargeInvoiceData.quantitybilled,
                            exchangerate: objCustomerInvoiceData.exchangerate
                        };
                    } else {
                        var inChargeInvoice = recObject.getValue({
                            fieldId: fn.TIME_MASTER.INVOICE
                        });

                        var objChargeInvoiceData = fn.getInvoiceDetails(recObject.getValue({fieldId: fn.TIME_MASTER.INVOICE}));
                        var objCustomerInvoiceData = fn.getInvoiceDetails(inChargeInvoice);
                        var flRate = parseFloat(parseFloat(objCustomerInvoiceData.fxrate) / parseFloat(objChargeInvoiceData.quantityuom));
                        objHourlyRateLocalCurrency = {
                            trandate: objCustomerInvoiceData.trandate,
                            currency: objCustomerInvoiceData.currency,
                            currencysymbol: objCustomerInvoiceData.currencysymbol,
                            item: objCustomerInvoiceData.item,
                            fxrate: flRate,
                            quantitybilled: objChargeInvoiceData.quantitybilled,
                            exchangerate: objCustomerInvoiceData.exchangerate
                        };
                    }

                    if (objInvoiceProject.intNumberOfInvoices > 1) {
                        recObject.setValue({fieldId: fn.TIME_MASTER.IS_MULTIPLE_INVOICE, value: true});
                    }
                } else {
                    var intInvoiceProject = recObject.getValue({fieldId: fn.TIME_MASTER.INVOICE});
                    if (intInvoiceProject) {
                        recObject.setValue({fieldId: fn.TIME_MASTER.CUSTOMER_INVOICE, value: intInvoiceProject});
                    }
                    objHourlyRateLocalCurrency = fn.captureHourlyRateLocalCurrency(recObject.getValue({fieldId: fn.TIME_MASTER.CUSTOMER_INVOICE}), recObject.getValue({fieldId: fn.TIME_MASTER.SERVICE_ITEM}), objProjectFields.customerid);
                }

                fn.convertAmountToUSD(recObject, objHourlyRateLocalCurrency);
                fn.calculateRevenue(recObject);
            }
        }

        fn.checkTimeEntry = function (intTimeId) {
            var isExist = false;
            var timebillSearchObj = search.create({
                type: "timebill",
                filters: ["internalid", "anyof", [intTimeId]],
                columns: [search.createColumn({name: "employee", label: "Employee"})]
            });
            var searchResultCount = timebillSearchObj.runPaged().count;
            if (searchResultCount != 0) {
                isExist = true;
            }
            return isExist;
        }

        fn.getInvoiceProject = function (recObject) {
            var objData = {intInvoiceId: "", intNumberOfInvoices: 0};
            var intInvoiceId = "";
            var searchResults = search.load({id: fn.SAVE_SEARCH.INVOICE_PER_PROJECT});

            var filters = searchResults.filters;
            var intProjectId = recObject.getValue({fieldId: fn.TIME_MASTER.PROJECT});
            filters.push({
                name: "formulatext",
                formula: "{transaction.number}",
                operator: "doesnotcontain",
                values: "-"
            });

            if (intProjectId) {
                filters.push({name: "internalid", operator: "anyof", values: [intProjectId]});
                searchResults.filters = filters

                var searchResultCount = searchResults.runPaged().count;

                if (searchResultCount != 0) {
                    searchResults.run().each(function (result) {
                        objData.intInvoiceId = result.getValue({name: "internalid", join: "transaction"});
                        return true;
                    });
                }
                objData.intNumberOfInvoices = searchResultCount;
            }
            return objData;
        }

        fn.getActualInvoice = function (recObject) {
            var objData = {intInvoiceId: "", intNumberOfInvoices: 0};
            var arrInvoice = recObject.getText({fieldId: fn.TIME_MASTER.INVOICE}).split('-');

            if (arrInvoice.length != 0) {
                var searchResults = search.load({id: fn.SAVE_SEARCH.INVOICE_PER_PROJECT});
                var filters = searchResults.filters;
                filters.push({
                    name: "formulatext",
                    formula: "{transaction.number}",
                    operator: "contains",
                    values: arrInvoice[0].replace("Invoice #", "")
                });
                searchResults.filters = filters
                var searchResultCount = searchResults.runPaged().count;

                if (searchResultCount != 0) {
                    searchResults.run().each(function (result) {
                        objData.intInvoiceId = result.getValue({name: "internalid", join: "transaction"});
                        return true;
                    });
                }

                objData.intNumberOfInvoices = searchResultCount;
            }

            return objData;
        }

        fn.getTimeEntryDetails = function (timeBillId) {
            var objTimeEntryDetails = {};
            if (timeBillId) {
                var recTimeEntry = record.load({type: record.Type.TIME_BILL, id: timeBillId, isDynamic: true});
                objTimeEntryDetails['inProject'] = recTimeEntry.getValue({fieldId: 'customer'});
                objTimeEntryDetails['inApprovalStatus'] = recTimeEntry.getValue({fieldId: 'approvalstatus'});
                objTimeEntryDetails['stDuration'] = recTimeEntry.getValue({fieldId: 'hours'});
                objTimeEntryDetails['isBillable'] = recTimeEntry.getValue({fieldId: 'isbillable'});
                objTimeEntryDetails['stTimeOffType'] = recTimeEntry.getValue({fieldId: 'timeofftype'});
                objTimeEntryDetails['inEmployee'] = recTimeEntry.getValue({fieldId: 'employee'});
                objTimeEntryDetails['stEmployee'] = recTimeEntry.getText({fieldId: 'employee'});
                objTimeEntryDetails['isUtilized'] = recTimeEntry.getText({fieldId: 'isutilized'});
                objTimeEntryDetails['inItem'] = recTimeEntry.getValue({fieldId: 'item'});
            }
            return objTimeEntryDetails;
        }

        fn.getInvoiceDetails = function (intInvoiceId) {
            var objData = {};
            var invoiceSearchObj = search.create({
                type: "invoice",
                filters: [
                    ["type", "anyof", "CustInvc"], "AND",
                    ["internalid", "anyof", intInvoiceId], "AND",
                    ["taxline", "is", "F"], "AND",
                    ["quantity", "isnotempty", ""]
                ],
                columns: [
                    search.createColumn({name: "trandate", label: "Date"}),
                    search.createColumn({name: "fxamount", label: "Amount (Foreign Currency)"}),
                    search.createColumn({name: "currency", label: "Currency"}),
                    search.createColumn({name: "item", label: "Item"}),
                    search.createColumn({name: "quantity"}),
                    search.createColumn({name: "quantitybilled"}),
                    search.createColumn({name: "exchangerate", label: "Exchange Rate"})
                ]
            });

            var searchResultCount = invoiceSearchObj.runPaged().count;

            if (searchResultCount != 0) {
                invoiceSearchObj.run().each(function (result) {
                    objData = {
                        trandate: result.getValue("trandate"),
                        currency: result.getValue("currency"),
                        currencysymbol: result.getText("currency"),
                        item: result.getValue("item"),
                        fxrate: result.getValue("fxamount"),
                        quantitybilled: result.getValue("quantitybilled"),
                        quantityuom: result.getValue("quantity"),
                        exchangerate: result.getValue("exchangerate")
                    };
                    return true;
                });
            }

            return objData;

        }

        fn.captureHourlyRateLocalCurrency = function (intCustomerInvoiceId, intItemId, intCustomerId) {
            var objData = {};
            var searchResults = search.load({id: fn.SAVE_SEARCH.INVOICE_HOURLY_RATE});
            var filters = searchResults.filters;
            if (intCustomerId) {
                filters.push({name: "internalid", join: "customermain", operator: "anyof", values: [intCustomerId]});
            }

            if (intItemId) {
                filters.push({name: "item", operator: "anyof", values: [intItemId]});
            }

            if (intCustomerInvoiceId) {
                filters.push({name: "internalid", operator: "anyof", values: [intCustomerInvoiceId]});
            }

            searchResults.filters = filters;
            var searchResultCount = searchResults.runPaged().count;

            if (searchResultCount != 0) {
                searchResults.run().each(function (result) {
                    objData = {
                        trandate: result.getValue("trandate"),
                        currency: result.getValue("currency"),
                        currencysymbol: result.getText("currency"),
                        item: result.getValue("item"),
                        fxrate: result.getValue("fxrate"),
                        quantitybilled: result.getValue("quantitybilled"),
                        exchangerate: result.getValue("exchangerate")
                    };

                    return true;
                });
            }

            return objData;

        }

        fn.convertAmountToUSD = function (recObject, objHourlyRateLocalCurrency) {
            log.debug('objHourlyRateLocalCurrency', objHourlyRateLocalCurrency);
            var rate = objHourlyRateLocalCurrency.fxrate;
            var exchangerate = objHourlyRateLocalCurrency.exchangerate;
            var invoiceHourlyRateOrigCurrencyOverride = recObject.getValue(fn.TIME_MASTER.INVOICE_HOURLY_RATE_ORIG_CURRENCY_OVERRIDE);

            recObject.setValue(fn.TIME_MASTER.INVOICE_HOURLY_RATE_ORIG_CURRENCY, rate);
            recObject.setValue(fn.TIME_MASTER.INVOICE_ORIGINAL_CURRENCY, objHourlyRateLocalCurrency.currency);
            if (objHourlyRateLocalCurrency.currency != USD_ID) {
                if (typeof objHourlyRateLocalCurrency.trandate != 'undefined') {
                    exchangerate = fn.getExchangeRate(objHourlyRateLocalCurrency.trandate, objHourlyRateLocalCurrency.currency);
                    log.debug('exchangerate is not usd', exchangerate);
                    rate = parseFloat(exchangerate * rate).toFixed(2);
                }
            } else {
                exchangerate = 1;
                log.debug('exchangerate is usd', exchangerate);
            }

            /** IF INVOICED HOURLY RATE ORIG CURRENCY OVERRIDE IS NOT EMPTY **/
            if (invoiceHourlyRateOrigCurrencyOverride) {
                rate = parseFloat(exchangerate * invoiceHourlyRateOrigCurrencyOverride).toFixed(2);
                recObject.setValue(fn.TIME_MASTER.INVOICE_USD_HOURLY_RATE_OVERRIDE, rate);
            } else {
                recObject.setValue(fn.TIME_MASTER.INVOICE_USD_RATE_PER_HOUR, rate);
            }
        }

        fn.getExchangeRate = function (stDate, intSourceCurrency) {
            var exchangerate = 0;
            if (stDate) {
                var dtDate = new Date(fn.getFormattedDate(stDate));
                exchangerate = currency.exchangeRate({source: intSourceCurrency, target: 'USD', date: dtDate});
            }
            return exchangerate;
        }

        fn.calculateRevenue = function (recObject) {
            var flInvoiceUSDRate = recObject.getValue(fn.TIME_MASTER.INVOICE_USD_RATE_PER_HOUR) || 0;
            var flInvoiceUSDRateOverride = recObject.getValue(fn.TIME_MASTER.INVOICE_USD_HOURLY_RATE_OVERRIDE);
            var flQtyBilled = recObject.getValue(fn.TIME_MASTER.QUANTITY_BILLED) || 0;
            var flTotalRevenue = parseFloat(parseFloat(flInvoiceUSDRate) * parseFloat(flQtyBilled)).toFixed(2);

            /** IF INVOICED USD HOURLY RATE OVERRIDE IS NOT EMPTY **/
            if (flInvoiceUSDRateOverride) {
                flTotalRevenue = parseFloat(parseFloat(flInvoiceUSDRateOverride) * parseFloat(flQtyBilled)).toFixed(2);
            }

            log.debug('calculateRevenue flTotalRevenue', flTotalRevenue);
            recObject.setValue(fn.TIME_MASTER.CALCULATED_REVENUE, flTotalRevenue);
        }

        fn.getCurrencies = function () {
            var objData = {};
            var searchObj = search.create({
                type: "currency",
                filters: ["isinactive", "is", "F"],
                columns: [
                    search.createColumn({name: "exchangerate"}),
                    search.createColumn({name: "name"}),
                    search.createColumn({name: "symbol"}),
                ]
            });
            var searchResultCount = searchObj.runPaged().count;
            if (searchResultCount != 0) {
                searchObj.run().each(function (result) {
                    if (objData[result.getValue('name')] == null) {
                        objData[result.getValue('name')] = {};
                    }
                    objData[result.getValue('name')] = {
                        "recordid": result.id,
                        "name": result.getValue('name'),
                        "exchangerate": result.getValue('exchangerate'),
                        "symbol": result.getValue('symbol'),
                    };
                    return true;
                });
            }

            return objData;
        }

        fn.clearAllFields = function (recObject) {
            for (var fieldName in fn.TIME_MASTER) {
                if (fieldName != fn.TIME_MASTER.TYPE && fieldName != fn.TIME_MASTER.NAME) {
                    // log.debug(' fn.TIME_MASTER[fieldName]', fn.TIME_MASTER[fieldName]);
                    recObject.setValue({
                        fieldId: fn.TIME_MASTER[fieldName],
                        value: ''
                    });
                }
            }
        }

        fn.getURL = function (stScript, stDeployment) {
            var baseURL = 'https://';
            baseURL += url.resolveDomain({
                hostType: url.HostType.APPLICATION
            });

            var urlLink = url.resolveScript({
                scriptId: stScript,
                deploymentId: stDeployment,
                returnExternalUrl: false
            });

            var sendURL = baseURL + urlLink;

            return urlLink;
        }

        fn.setTimeEntry = function (recObject, inTimeEntry) {
            try {
                if (inTimeEntry) {
                    recObject.setValue({
                        fieldId: fn.TIME_MASTER.TIME,
                        value: inTimeEntry
                    });
                }
            } catch (e) {
                log.debug('Error : setTimeEntry', e);
            }
        }

        fn.setSalesOrder = function (recObject, inSalesOrder) {
            try {
                if (inSalesOrder) {
                    recObject.setValue({
                        fieldId: fn.TIME_MASTER.SALES_ORDER,
                        value: inSalesOrder
                    });
                }

            } catch (e) {
                log.debug('Error : setSalesOrder', e);
            }
        }

        fn.setProject = function (recObject, inProject) {
            try {
                if (inProject) {
                    recObject.setValue({
                        fieldId: fn.TIME_MASTER.PROJECT,
                        value: inProject
                    });
                }
            } catch (e) {
                log.debug('Error : setProject', e);
            }
        }

        fn.setChargeLink = function (recObject, inChargeId) {
            try {
                if (inChargeId) {
                    recObject.setValue({
                        fieldId: fn.TIME_MASTER.CHARGE,
                        value: inChargeId
                    });
                    recObject.setValue({
                        fieldId: fn.TIME_MASTER.LINK,
                        value: fn.resolveChargeUrl(inChargeId)
                    });
                }
            } catch (e) {
                log.debug('Error : setChargeLink', e);
            }
        }

        fn.setDuration = function (recObject, dcDuration) {
            try {
                // log.debug('dcDuration', dcDuration);
                // if(dcDuration){
                recObject.setValue({
                    fieldId: fn.TIME_MASTER.DURATION,
                    value: dcDuration
                });
                // }
            } catch (e) {
                log.debug('Error : setDuration', e);
            }
        }

        fn.setBillable = function (recObject, isBillable) {
            try {
                if (isBillable) {
                    recObject.setValue({
                        fieldId: fn.TIME_MASTER.IS_BILLABLE,
                        value: true
                    });
                } else {
                    recObject.setValue({
                        fieldId: fn.TIME_MASTER.IS_BILLABLE,
                        value: false
                    });
                }

            } catch (e) {
                log.debug('Error : setBillable', e);
            }
        }

        fn.setIsFixPrice = function (recObject, stProjectName) {
            try {
                if (stProjectName) {
                    if (stProjectName.indexOf('Fixed Price') != -1) {
                        // if(stProjectName == 'Fixed Price' || stProjectName == 'Fixed Price, Prepaid, Quarterly'){
                        recObject.setValue({
                            fieldId: fn.TIME_MASTER.IS_FIXED_PRICE,
                            value: true
                        });
                    } else {
                        recObject.setValue({
                            fieldId: fn.TIME_MASTER.IS_FIXED_PRICE,
                            value: false
                        });
                    }
                }
            } catch (e) {
                log.debug('Error : setIsFixPrice', e);
            }
        }

        fn.setIsInvoice = function (recObject, inInvoice) {
            try {
                if (inInvoice) {
                    recObject.setValue({
                        fieldId: fn.TIME_MASTER.IS_INVOICED,
                        value: true
                    });

                    recObject.setValue({
                        fieldId: fn.TIME_MASTER.INVOICE,
                        value: inInvoice
                    });
                } else {
                    recObject.setValue({
                        fieldId: fn.TIME_MASTER.IS_INVOICED,
                        value: false
                    });
                }
            } catch (e) {
                log.debug('Error : setIsInvoice', e);
            }
        }

        fn.setIsLearning = function (recObject, stProjectName) {
            try {
                if (stProjectName) {

                    if (stProjectName.indexOf('Atlassian Certification') != -1 || stProjectName.indexOf('Franklin Covey Training') != -1) {
                        recObject.setValue({
                            fieldId: fn.TIME_MASTER.IS_LEARNING,
                            value: true
                        });
                    } else {
                        recObject.setValue({
                            fieldId: fn.TIME_MASTER.IS_LEARNING,
                            value: false
                        });
                    }
                }
            } catch (e) {
                log.debug('Error : setIsLearning', e);
            }
        }

        fn.setIsPaid = function (recObject, inInvoice) {

            try {
                if (inInvoice) {
                    var fldInvoice = search.lookupFields({
                        type: 'invoice',
                        id: inInvoice,
                        columns: ['status']
                    });

                    if (fldInvoice.status) {
                        var stStatus = fldInvoice.status[0].value;
                        if (stStatus == 'paidInFull') {
                            recObject.setValue({
                                fieldId: fn.TIME_MASTER.IS_PAID,
                                value: true
                            });
                        } else {
                            recObject.setValue({
                                fieldId: fn.TIME_MASTER.IS_PAID,
                                value: false
                            });
                        }
                    }
                }
            } catch (e) {
                log.debug('Error : setIsPaid', e);
            }
        }

        fn.setIsPMO = function (recObject, stProjectName) {
            try {
                if (stProjectName) {
                    if (stProjectName.indexOf('PMO') != -1) {
                        recObject.setValue({
                            fieldId: fn.TIME_MASTER.IS_PMO,
                            value: true
                        });
                    } else {
                        recObject.setValue({
                            fieldId: fn.TIME_MASTER.IS_PMO,
                            value: false
                        });
                    }
                }
            } catch (e) {
                log.debug('Error : setIsPMO', e);
            }
        }

        fn.setIsPrePaid = function (recObject, stBillingSchedule) {
            try {
                if (stBillingSchedule) {
                    if (stBillingSchedule.indexOf('Prepaid') != -1) {
                        recObject.setValue({
                            fieldId: fn.TIME_MASTER.IS_PREPAID,
                            value: true
                        });
                    } else {
                        recObject.setValue({
                            fieldId: fn.TIME_MASTER.IS_PREPAID,
                            value: false
                        });
                    }
                }
            } catch (e) {
                log.debug('Error : setIsPrePaid', e);
            }
        }

        fn.setIsTimeOff = function (recObject, stTimeOffType) {
            try {
                if (stTimeOffType) {
                    recObject.setValue({
                        fieldId: fn.TIME_MASTER.IS_TIMEOFF,
                        value: true
                    });
                } else {
                    recObject.setValue({
                        fieldId: fn.TIME_MASTER.IS_TIMEOFF,
                        value: false
                    });
                }
            } catch (e) {
                log.debug('Error : setIsTimeOff', e);
            }
        }

        fn.setIsWriteOff = function (recObject, blIsUtilized, inApprovalStatus, isBillable) {
            try {

                blIsUtilized = (blIsUtilized == 'T') ? true : false;
                if (blIsUtilized && (inApprovalStatus == STATUS_APPROVED) && !isBillable) {
                    recObject.setValue({
                        fieldId: fn.TIME_MASTER.IS_WRITEOFF,
                        value: true
                    });
                } else {
                    recObject.setValue({
                        fieldId: fn.TIME_MASTER.IS_WRITEOFF,
                        value: false
                    });
                }
            } catch (e) {
                log.debug('Error : setIsWriteOff', e);
            }

        }

        fn.setTimeEmployee = function (recObject, inEmployee) {
            try {
                if (inEmployee) {
                    if (!isInactiveEmployee(inEmployee)) {
                        recObject.setValue({
                            fieldId: fn.TIME_MASTER.TIME_EMPLOYEE,
                            value: inEmployee
                        });
                    }
                }
            } catch (e) {
                log.debug('Error : setTimeEmployee', e);
            }

        }

        fn.setName = function (recObject, inTimeEntryId, stEmployee) {
            try {
                var stTimeMasterName = inTimeEntryId + ' : ' + stEmployee
                if (stTimeMasterName) {
                    recObject.setValue({
                        fieldId: fn.TIME_MASTER.NAME,
                        value: stTimeMasterName
                    });
                }
            } catch (e) {
                log.debug('Error : setName', e);
            }
        }

        fn.setRatePerHourOrig = function (recObject, inSalesOrder) {
            try {
                if (inSalesOrder) {
                    recObject.setValue({
                        fieldId: fn.TIME_MASTER.RATE_PER_HOUR_ORIG,
                        value: inSalesOrder.ratePerHourOrig
                    });
                }
            } catch (e) {
                log.debug('error : setRatePerHourOrig', e);
            }
        }

        fn.setServiceItem = function (recObject, inSalesOrder) {
            try {
                if (inSalesOrder) {
                    recObject.setValue({
                        fieldId: fn.TIME_MASTER.SERVICE_ITEM,
                        value: inSalesOrder.serviceItem
                    });
                }
            } catch (e) {
                log.debug('error : setServiceItem', e);
            }
        }

        fn.setUSDRatePerHour = function (recObject, inSalesOrder) {
            try {
                if (inSalesOrder) {
                    recObject.setValue({
                        fieldId: fn.TIME_MASTER.USD_RATE_PER_HOUR,
                        value: inSalesOrder.usdRatePerHour
                    });
                }
            } catch (e) {
                log.debug('error : setUSDRatePerHour', e);
            }
        }

        fn.setOrigCurrency = function (recObject, inSalesOrder) {
            try {
                if (inSalesOrder) {
                    recObject.setValue({
                        fieldId: fn.TIME_MASTER.RATE_ORIG_CURRENCY,
                        value: inSalesOrder.rateOrigCurrency
                    });
                }
            } catch (e) {
                log.debug('error : setOrigCurrency', e);
            }
        }

        fn.getProjectFields = function (inProject) {
            var objProject = {
                name: '',
                billingSchedule: '',
                projectType: ''
            };

            try {
                if (inProject) {
                    var fldProject = search.lookupFields(
                        {
                            type: 'job',
                            id: inProject,
                            columns: ['entityid', 'billingschedule', 'jobtype', 'customer']
                        }
                    );

                    if (fldProject.entityid) {
                        var stName = fldProject.entityid;
                        objProject.name = stName;
                    }

                    if (fldProject.customer && (fldProject.customer.length != 0)) {
                        objProject.customername = fldProject.customer[0].text;
                        objProject.customerid = fldProject.customer[0].value;
                    }

                    if (fldProject.billingschedule && (fldProject.billingschedule.length != 0)) {
                        var stName = fldProject.billingschedule[0].text;
                        objProject.billingSchedule = stName;
                    }
                    if (fldProject.jobtype && (fldProject.jobtype.length != 0)) {
                        var stName = fldProject.jobtype[0].text;
                        objProject.projectType = stName;
                    }
                }
            } catch (e) {
                log.debug('Error : getProjectFields', e)
            }

            return objProject;
        }

        fn.deleteTimeMasterById = function (inTimeMaster) {
            try {
                if (inTimeMaster) {
                    record.delete({
                        type: fn.TIME_MASTER.TYPE,
                        id: inTimeMaster
                    });
                }
            } catch (e) {
                log.debug('deleteTimeMasterById', e);
            }
        }

        function isInactiveEmployee(inEmployee) {
            var isInactive = false;
            try {
                if (inEmployee) {
                    var fldEmployee = search.lookupFields({
                        type: 'employee',
                        id: inEmployee,
                        columns: ['isinactive']
                    });
                    isInactive = fldEmployee.isinactive;
                }
            } catch (e) {
                log.debug('isInactiveEmployee: error', e);
            }
            return isInactive;
        }

        //CONVERT DURATION STRING TO FLOAT
        function timeStringToDecimal(time) {
            var hoursMinutes = time.split(/[.:]/);
            var hours = parseInt(hoursMinutes[0], 10);
            var minutes = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;
            return hours + minutes / 60;
        }

        fn.deleteTimeMaster = function () {
            log.debug('Start');
            var searchTimeMaster = search.create({
                type: "customrecord_sr_time_master",
                filters:
                    [
                        ["custrecord_sr_time_entry", "anyof", "@NONE@"]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "internalid",
                            sort: search.Sort.ASC,
                            label: "Internal ID"
                        }),
                        search.createColumn({name: "custrecord_sr_time_entry", label: "Time"}),
                    ]
            });
            searchTimeMaster.run().each(function (result) {
                var inTime = result.getValue({
                    name: 'custrecord_sr_time_entry'
                });

                if (!inTime) {
                    var recTimeMaster = record.delete({
                        type: 'customrecord_sr_time_master',
                        id: result.id,
                    });
                }

                log.debug('End recTimeMaster', recTimeMaster);
                return true;
            });
        }

        fn.getFormattedDate = function (stDate) {
            var month_names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            var month_names_short = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            var objMonth = {
                'Jan': 1,
                'Feb': 2,
                'Mar': 3,
                'Apr': 4,
                'May': 5,
                'Jun': 6,
                'Jul': 7,
                'Aug': 8,
                'Sep': 9,
                'Oct': 10,
                'Nov': 11,
                'Dec': 12
            };

            // var objCompanyPrefConfig = config.load({
            //     type: config.Type.COMPANY_PREFERENCES,
            //     isDynamic: true
            // });
            // var datePref = objCompanyPrefConfig.getValue({
            //     fieldId: "DATEFORMAT"
            // });

            switch (stDatePreference) {
                case 'M/D/YYYY':
                case 'MM/DD/YYYY':
                    var arrDate = stDate.split('/');
                    var strdate = new Date(arrDate[0] + '/' + arrDate[1] + '/' + arrDate[2]);
                    return strdate;
                    // return Number(strdate.getMonth()+1) + '/' + strdate.getDate() + '/' + strdate.getFullYear();
                    break;
                case 'D/M/YYYY':
                case 'DD/MM/YYYY':
                    var arrDate = stDate.split('/');
                    var strdate = new Date(arrDate[1] + '/' + arrDate[0] + '/' + arrDate[2]); //MM/DD/YYYY
                    return strdate;
                    // return strdate.getDate() + '/' +Number(strdate.getMonth()+1) + '/' + strdate.getFullYear();
                    break;
                case 'D-Mon-YYYY':
                case 'DD-Mon-YYYY':
                    var arrDate = stDate.split('-');
                    var strdate = new Date(objMonth[arrDate[1]] + '/' + arrDate[0] + '/' + arrDate[2]); //MM/DD/YYYY
                    return strdate;
                    // return strdate.getDate() + '-' +month_names_short[strdate.getMonth()] + '-' + strdate.getFullYear();
                    break;
                case 'D.M.YYYY':
                case 'DD.MM.YYYY':
                    var arrDate = stDate.split('.');
                    var strdate = new Date(arrDate[1] + '/' + arrDate[0] + '/' + arrDate[2]); //MM/DD/YYYY
                    return strdate;
                    // return strdate.getDate() + '.' +Number(strdate.getMonth()+1) + '.' + strdate.getFullYear();
                    break;
                case 'D-MONTH-YYYY':
                case 'DD-MONTH-YYYY':
                    var strdate = new Date(stDate); //MM/DD/YYYY
                    return strdate;
                    // return strdate.getDate() + '-' +month_names[strdate.getMonth()] + '-' + strdate.getFullYear();
                    break;
                case 'D MONTH, YYYY':
                case 'DD MONTH, YYYY':
                    var strdate = new Date(stDate); //MM/DD/YYYY
                    return strdate;
                    // return strdate.getDate() + ' ' +month_names[strdate.getMonth()] + ', ' + strdate.getFullYear();
                    break;
                case 'YYYY/M/D':
                case 'YYYY/MM/DD':
                    var arrDate = stDate.split('/');
                    var strdate = new Date(arrDate[1] + '/' + arrDate[2] + '/' + arrDate[0]); //MM/DD/YYYY
                    return strdate;
                    // return strdate.getFullYear() + '/' + Number(strdate.getMonth()+1) + '/' + strdate.getDate();
                    break;
                case 'YYYY-M-D':
                case 'YYYY-MM-DD':
                    var arrDate = stDate.split('-');
                    var strdate = new Date(arrDate[1] + '/' + arrDate[2] + '/' + arrDate[0]); //MM/DD/YYYY
                    return strdate;
                    // return strdate.getFullYear() + '-' + Number(strdate.getMonth()+1) + '-' + strdate.getDate();
                    break;
            }
        }

        fn.runSearch = function (recType, searchId, filters, columns) {
            var srchObj = null;
            var arrSearchResults = [];
            var arrResultSet = null;
            var intSearchIndex = 0;

            // if search is ad-hoc (created via script)
            if (searchId == null || searchId == '') {
                srchObj = search.create({
                    type: recType,
                    filters: filters,
                    columns: columns
                });
            } else { // if there is an existing saved search called and used inside the script
                srchObj = search.load({
                    id: searchId
                });
                var existFilters = srchObj.filters;
                var existColumns = srchObj.columns;

                var arrNewFilters = [];
                var bIsResultsWithSummary = false;

                for (var i = 0; i < existFilters.length; i++) {
                    var stFilters = JSON.stringify(existFilters[i]);
                    var objFilters = JSON.parse(stFilters);

                    var objFilter = search.createFilter({
                        name: objFilters.name,
                        join: objFilters.join,
                        operator: objFilters.operator,
                        values: objFilters.values,
                        formula: objFilters.formula,
                        summary: objFilters.summary
                    });

                    arrNewFilters.push(objFilter);
                }

                existFilters = (existFilters == null || existFilters == '') ? new Array() : existFilters;
                existColumns = (existColumns == null || existColumns == '') ? new Array() : existColumns;

                // include additional filters created via script
                if (filters != null && filters != '') {
                    for (var idx = 0; idx < filters.length; idx++) {
                        existFilters.push(filters[idx]);
                    }
                }

                //  log.debug('Filter', JSON.stringify(existFilters));

                // include additional columns created via script
                if (columns != null && columns != '') {
                    for (var idx = 0; idx < columns.length; idx++) {
                        existColumns.push(columns[idx]);
                    }
                }

                for (var i = 0; i < existColumns.length; i++) {
                    var stColumns = JSON.stringify(existColumns[i]);
                    var objColumns = JSON.parse(stColumns);

                    if (objColumns.summary != null) {
                        bIsResultsWithSummary = true;
                        break;
                    }
                }

                if (!bIsResultsWithSummary) {
                    existColumns.push(search.createColumn({
                        name: 'internalid'
                    }));
                } else {
                    existColumns.push(search.createColumn({
                        name: 'internalid',
                        summary: 'GROUP'
                    }));
                }

                // reset original filters and columns to original ones + those passed via script
                srchObj.filters = existFilters;
                srchObj.columns = existColumns;
            }

            var objRS = srchObj.run();

            // do the logic below to get all the search results because if not, you will only get 4000 max results
            do {
                arrResultSet = objRS.getRange(intSearchIndex, intSearchIndex + 1000);
                if (!(arrResultSet)) {
                    break;
                }

                arrSearchResults = arrSearchResults.concat(arrResultSet);
                intSearchIndex = arrSearchResults.length;
            } while (arrResultSet.length >= 1000);

            var objResults = {};
            objResults.resultSet = objRS;
            objResults.actualResults = arrSearchResults;
            objResults.stSearchRecType = srchObj.searchType;

            return objResults.actualResults;
        }

        return fn;
    });