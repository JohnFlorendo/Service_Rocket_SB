/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/runtime', 'N/currency', 'N/record', 'N/file', 'N/ui/serverWidget', 'N/format', 'N/redirect', 'N/search', 'N/email', '../../Helper/srdatehelper',
        '../../Estimate/api/lib/salesrep', '../../Jira/api/jira', '../../Library/momentjs/moment'],
    /**
     * @param {runtime} runtime
     * @param {currency} currency
     * @param {record} record
     * @param {file} file
     * @param {serverWidget} serverWidget
     * @param {format} format
     * @param {redirect} redirect
     */
    function (runtime, currency, record, file, serverWidget, format, redirect, search, email, srdatehelper,
              salesrep, jira, moment) {

        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        var USD = 1;
        var NAVYITEM = 6328;
        var SUBTOTAL = -2;
        var NAVYDISCOUNT = 6443;
        var LOYALTYDISCOUNT = 6447;
        var UPGRADECREDIT = 6448;
        var PRICEADJUSTMENT = 6451;

        function onRequest(context) {

            var objForm;
            var paramReq = context.request.parameters;
            var idOpportunity = paramReq.custpage_opportunity;
            var idEstimate = paramReq.custpage_estimate;

            if (context.request.method === 'GET') {

                objForm = serverWidget.createForm({
                    title: 'Upload JSON'
                });

                var fldOpportunity = objForm.addField({
                    id: 'custpage_opportunity',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Opportunity ID'
                });
                fldOpportunity.updateDisplayType({
                    displayType: 'HIDDEN'
                });
                fldOpportunity.defaultValue = idOpportunity;
                var fldEstimate = objForm.addField({
                    id: 'custpage_estimate',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Estimate'
                });
                fldEstimate.addSelectOption({
                    value: -1,
                    text: 'New Estimate',
                    isSelected: true
                });

                var recOpp = record.load({
                    type: record.Type.OPPORTUNITY,
                    id: idOpportunity
                });

                if (recOpp.getLineCount({
                    sublistId: 'estimates'
                }) > 0) {

                    for (var nLine = 0; nLine < recOpp.getLineCount({
                        sublistId: 'estimates'
                    }); nLine++) {

                        fldEstimate.addSelectOption({
                            value: recOpp.getSublistValue({
                                sublistId: 'estimates',
                                fieldId: 'id',
                                line: nLine
                            }),
                            text: recOpp.getSublistValue({
                                sublistId: 'estimates',
                                fieldId: 'tranid',
                                line: nLine
                            })
                        });

                    }
                } else {
                    fldEstimate.updateDisplayType({
                        displayType: 'HIDDEN'
                    });
                }

                var fldFile = objForm.addField({
                    id: 'custpage_json_file',
                    type: serverWidget.FieldType.FILE,
                    label: 'Select JSON file to upload.'
                });
                fldFile.isMandatory = true;
                objForm.addSubmitButton({
                    label: 'Upload'
                });

                context.response.writePage(objForm);
            } else if (context.request.method === 'POST') {

                objForm = serverWidget.createForm({
                    title: 'Upload Another JSON?'
                });

                var fldOpportunity = objForm.addField({
                    id: 'custpage_opportunity',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Opportunity ID'
                });
                fldOpportunity.updateDisplayType({
                    displayType: 'HIDDEN'
                });
                fldOpportunity.defaultValue = idOpportunity;
                var fldEstimate = objForm.addField({
                    id: 'custpage_estimate',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Estimate'
                });

                fldEstimate.addSelectOption({
                    value: -1,
                    text: 'New Estimate'
                });

                var fldMessage = objForm.addField({
                    id: 'custpage_message',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: 'Message'
                });
                var recOpp = record.load({
                    type: record.Type.OPPORTUNITY,
                    id: idOpportunity
                });
                var fldFile = objForm.addField({
                    id: 'custpage_json_file',
                    type: serverWidget.FieldType.FILE,
                    label: 'Select JSON file to upload.'
                });
                fldFile.isMandatory = true;
                objForm.addSubmitButton({
                    label: 'Upload'
                });

                var nBuffer = runtime.getCurrentScript().getParameter({
                    name: 'custscript_nvy_fx_buffer'
                });

                nBuffer = parseFloat(nBuffer / 100) + parseFloat('1');

                var objFile = context.request.files['custpage_json_file'];
                objFile.folder = 7622;
                var idFile = objFile.save();

                record.attach({
                    record: {
                        type: 'file',
                        id: idFile
                    },
                    to: {
                        type: 'opportunity',
                        id: idOpportunity
                    }
                });

                log.audit({
                    title: 'onRequest',
                    details: 'file: ' + file.load({
                        id: idFile
                    }).getContents()
                });

                var objJSON = JSON.parse(file.load({
                    id: idFile
                }).getContents());

                log.audit({
                    title: 'onRequest',
                    details: 'objJSON: ' + JSON.stringify(objJSON)
                });

                var arrItems = objJSON.orderItems;

                //try{

                var recEstimate;
                var nFxrate;
                var sAction = '';
                var srch = search.load({id: 'customsearch_atl_resell_map'}); //**DO NOT EDIT/DELETE** ATL Resell Map
                var res = getAllResults(srch);

                var objMap = {};

                res.forEach(function (result) {
                    objMap[result.getValue({name: 'name'}).toLowerCase()] = result.getText({name: 'custrecord_atlmap_nsitem'});
                });

                if (idEstimate != -1) {

                    recEstimate = record.load({
                        type: record.Type.ESTIMATE,
                        id: idEstimate,
                        isDynamic: true
                    });
                    nFxrate = currency.exchangeRate({
                        source: 'USD',
                        target: recEstimate.getValue({
                            fieldId: 'currencysymbol'
                        }),
                        date: new Date(isoToNSdate(objJSON.createdDate))
                    });
                    sAction = 'updated.';
                } else {

                    recEstimate = record.transform({
                        fromType: record.Type.OPPORTUNITY,
                        fromId: idOpportunity,
                        toType: record.Type.ESTIMATE,
                        isDynamic: true
                    });
                    recEstimate.setValue({
                        fieldId: 'custbody_end_user',
                        value: recEstimate.getValue({
                            fieldId: 'entity'
                        })
                    });
                    recEstimate.setValue({
                        fieldId: 'class',
                        value: 90
                    });
                    recEstimate.setValue({
                        fieldId: 'trandate',
                        value: format.parse({
                            value: new Date(isoToNSdate(objJSON.createdDate)),
                            type: format.Type.DATE
                        })
                    });
                    recEstimate.setValue({
                        fieldId: 'duedate',
                        value: format.parse({
                            value: srdatehelper.dateAddMonths(new Date(), 1),
                            type: format.Type.DATE
                        })
                    });
                    recEstimate.setValue({
                        fieldId: 'custbody_atl_quote_number',
                        value: objJSON.orderNumber
                    });
                    recEstimate.setValue({
                        fieldId: 'custbody_quote_type',
                        value: 3
                    });
                    recEstimate.setValue({
                        fieldId: 'custbody_nvy_hide_prodname',
                        value: true
                    });

                    nFxrate = currency.exchangeRate({
                        source: 'USD',
                        target: recEstimate.getValue({
                            fieldId: 'currencysymbol'
                        }),
                        date: new Date(isoToNSdate(objJSON.createdDate))
                    });
                    recEstimate.setValue({
                        fieldId: 'custbody_nvy_usd_fxrate',
                        value: nFxrate
                    });

                    sAction = 'created.';
                }

                if (idEstimate != -1) {

                    recEstimate.setValue({
                        fieldId: 'custbody_nvy_cost',
                        value: parseFloat(recEstimate.getValue({
                                fieldId: 'custbody_nvy_cost'
                            })) +
                            parseFloat(objJSON.totalExTax)
                    });
                } else {

                    recEstimate.setValue({
                        fieldId: 'custbody_nvy_cost',
                        value: objJSON.totalExTax
                    });
                }

                var nMax = 0;
                var idOrderType = 1;

                if (recEstimate.getValue({
                    fieldId: 'currency'
                }) == USD) {

                    nBuffer = 1;
                }

                ///clean-up

                //var mainSEN = '';
                const mainSEN = arrItems.find(arrItems => arrItems.unitPrice == 0.00 && arrItems.saleType == 'RENEWAL' && arrItems.platform == 'CLOUD');

                var sCloudSiteHostname = '';

                if (mainSEN != undefined) {
                    sCloudSiteHostname = mainSEN.cloudSiteHostname;
                }

                var objError;

                arrItems.forEach(function (item, idx, arrItems) {

                    var sProductName = (item.productName).toLowerCase();
                    var sParent = 'RS10099';
                    var sSen = item.supportEntitlementNumber;
                    var dtStartDate = item.startDate;
                    var dtEndDate = item.stEndDate;


                    for (var key in objMap) {

                        if (sProductName.indexOf(key) > -1) {

                            if (sProductName.indexOf('for ' + key) == -1) {
                                sParent = objMap[key];
                                log.audit({title: 'Navy', details: 'Parent: ' + sParent});
                            }

                            break;
                        }
                    }

                    var sItem = sParent + ' : ' + sParent + '-' +
                        item.licenseType.substring(0, 1) +
                        item.saleType.substring(0, 1) +
                        item.platform.substring(0, 1);

                    if (item.total > nMax) {

                        nMax = item.total;

                        if (item.saleType == 'NEW') {
                            idOrderType = 1;
                        } else if (item.saleType == 'UPGRADE') {
                            idOrderType = 3;
                        } else if (item.saleType == 'RENEWAL') {
                            idOrderType = 2;
                        }
                    }

                    if (parseInt(item.unitPrice) > 0 && !isNaN(item.unitPrice)) {

                        var arrStart;
                        var sStart = '';
                        var arrEnd;
                        var sEnd = '';
                        var nRate = item.unitPrice * nFxrate * nBuffer;

                        if (item.startDate != undefined && item.startDate != null) {
                            sStart = isoToNSdate(item.startDate);
                        }

                        if (item.endDate != undefined && item.endDate != null) {
                            sEnd = isoToNSdate(item.endDate);
                        }

                        var sDesc = '';

                        if (item.description != null && item.description != '') {
                            sDesc = item.description + '. ';
                        }

                        if (item.platform == 'DATACENTER') {

                            sDesc = sDesc + 'Licensed To: ' + item.licensedTo + '. ';
                            sDesc = sDesc + 'Support Entitlement Number: ' + item.supportEntitlementNumber + '. ';

                            var sStartDate = item.startDate;
                            var sEndDate = item.endDate;

                            if (sStartDate != null && sStartDate != 'null' && sEndDate != null && sEndDate != 'null') {

                                sDate = (item.startDate.split('T')[0]).split('-');
                                sStartDate = sDate[2] + ' ' + srdatehelper.integerToMonthMMM(parseInt(sDate[1])) + ' ' + sDate[0];

                                sDate = (item.endDate.split('T')[0]).split('-');
                                sEndDate = sDate[2] + ' ' + srdatehelper.integerToMonthMMM(parseInt(sDate[1])) + ' ' + sDate[0];

                                sDesc = sDesc + 'License Period: ' + sStartDate + ' - ' + sEndDate + '.';
                            } else if (item.maintenanceMonths != null && item.maintenanceMonths != 'null') {

                                sDesc = sDesc + 'License Period: ' + item.maintenanceMonths + ' Months.';
                            }
                        } else if (item.platform == 'CLOUD') {

                            sDesc = sDesc + 'Site Address: ' + item.cloudSiteHostname + '. ';

                            if (sCloudSiteHostname == item.cloudSiteHostname) {
                                sDesc = sDesc + 'Support Entitlement Number: ' + mainSEN.supportEntitlementNumber + '. ';
                                sSen = mainSEN.supportEntitlementNumber;

                            } else {
                                sDesc = sDesc + 'Support Entitlement Number: ' + item.supportEntitlementNumber + '. ';
                            }

                            sDesc = sDesc + 'Licensed To: ' + item.licensedTo + '. ';

                            var sStartDate = item.startDate;
                            var sEndDate = item.endDate;

                            if (sStartDate != null && sStartDate != 'null' && sEndDate != null && sEndDate != 'null') {

                                var arrDate = (item.startDate.split('T')[0]).split('-');
                                sStartDate = arrDate[2] + ' ' + srdatehelper.integerToMonthMMM(parseInt(arrDate[1])) + ' ' + arrDate[0];

                                var arrDate = (item.endDate.split('T')[0]).split('-');

                                sEndDate = arrDate[2] + ' ' + srdatehelper.integerToMonthMMM(parseInt(arrDate[1])) + ' ' + arrDate[0];

                                sDesc = sDesc + 'Billing Period: ' + sStartDate + ' - ' + sEndDate + '.';
                            } else if (item.maintenanceMonths != null && item.maintenanceMonths != 'null') {

                                sDesc = sDesc + 'Billing Period: ' + item.maintenanceMonths + ' Months.';
                            }
                        } else if (item.platform == 'SERVER') {

                            sDesc = sDesc + 'Support Entitlement: ' + item.supportEntitlementNumber + '. ';
                            sDesc = sDesc + 'Licensed To: ' + item.licensedTo + '. ';

                            var sStartDate = item.startDate;
                            var sEndDate = item.endDate;

                            if (sStartDate != null && sStartDate != 'null' && sEndDate != null && sEndDate != 'null') {

                                sDate = (item.startDate.split('T')[0]).split('-');
                                sStartDate = sDate[2] + ' ' + srdatehelper.integerToMonthMMM(parseInt(sDate[1])) + ' ' + sDate[0];

                                sDate = (item.endDate.split('T')[0]).split('-');
                                sEndDate = sDate[2] + ' ' + srdatehelper.integerToMonthMMM(parseInt(sDate[1])) + ' ' + sDate[0];

                                sDesc = sDesc + 'Support Period: ' + sStartDate + ' - ' + sEndDate + '.';
                            } else if (item.maintenanceMonths != null && item.maintenanceMonths != 'null') {

                                sDesc = sDesc + 'Support Period: ' + item.maintenanceMonths + ' Months.';
                            }
                        }

                        //Adding New Item

                        recEstimate.selectNewLine({
                            sublistId: 'item'
                        });

                        log.audit({title: 'Navy', details: 'adding item: ' + sItem + ', price:' + nRate});

                        try {

                            recEstimate.setCurrentSublistText({
                                sublistId: 'item',
                                fieldId: 'item',
                                text: sItem
                            });
                        } catch (err) {

                            objError = err;
                            return false;
                        }

                        recEstimate.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            value: 1,
                            ignoreFieldChange: true
                        });

                        recEstimate.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'price',
                            value: -1,
                            ignoreFieldChange: true
                        });
                        recEstimate.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            value: nRate.toFixed(2),
                            ignoreFieldChange: false
                        });

                        recEstimate.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_atl_usd_rate',
                            value: item.unitPrice,
                            ignoreFieldChange: false
                        });
                        recEstimate.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'description',
                            value: sDesc,
                            ignoreFieldChange: true
                        });

                        recEstimate.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_nvy_sen',
                            value: sSen,
                            ignoreFieldChange: true
                        });

                        if (dtStartDate) {
                            dtStartDate = new Date(moment(dtStartDate).format('MM/DD/YYYY'));
                            recEstimate.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_sr_start_date',
                                value: dtStartDate,
                                ignoreFieldChange: true
                            });
                        }

                        if (dtEndDate) {
                            dtEndDate = new Date(moment(dtEndDate).format('MM/DD/YYYY'));
                            recEstimate.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_sr_end_date',
                                value: dtEndDate,
                                ignoreFieldChange: true
                            });
                        }

                        recEstimate.commitLine({
                            sublistId: 'item'
                        });

                        var hasDiscount1 = false;

                        if (item.discounts) {

                            for (var key in item.discounts) {

                                var sType = item.discounts[key].type;

                                if (sType != 'EXPERT' && sType != 'PRORATED_PRICE_ADJUSTMENT') {
                                    hasDiscount1 = true;
                                    break;
                                }
                            }

                        }

                        if (!hasDiscount1) {

                            var nextIdx = idx + 1;

                            if (nextIdx <= arrItems.length) {

                                if (arrItems[nextIdx]) {

                                    if (arrItems[nextIdx].discounts.length > 0) {

                                        var hasDiscount2 = false;

                                        for (var key in arrItems[nextIdx].discounts) {

                                            var sType = arrItems[nextIdx].discounts[key].type;

                                            if (sType != 'EXPERT' && sType != 'PRORATED_PRICE_ADJUSTMENT') {
                                                hasDiscount2 = true;
                                                break;
                                            }
                                        }

                                        if (hasDiscount2) {

                                            recEstimate.selectNewLine({
                                                sublistId: 'item'
                                            });
                                            recEstimate.setCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'item',
                                                value: SUBTOTAL,
                                                ignoreFieldChange: false
                                            });
                                            recEstimate.commitLine({
                                                sublistId: 'item'
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }

                    item.discounts.forEach(function (discount) {

                        var nDiscount = discount.amount * nFxrate * nBuffer;
                        var sType = discount.type;
                        var idDiscount = NAVYDISCOUNT;

                        if (nDiscount > 0 && sType != 'EXPERT' && sType != 'PRORATED_PRICE_ADJUSTMENT') {

                            var nDiscountAmout = 0 - discount.percentage;
                            nDiscountAmout = nDiscountAmout.toFixed(2) + '%';


                            if (sType == 'LOYALTY_DISCOUNT') {
                                idDiscount = LOYALTYDISCOUNT;
                            } else if (sType == 'UPGRADE_CREDIT') {

                                idDiscount = UPGRADECREDIT;
                                nDiscountAmout = 0 - nDiscount;
                            }

                            log.audit({
                                title: 'Navy',
                                details: 'adding discount: ' + idDiscount + ', price:' + nDiscountAmout
                            });

                            recEstimate.selectNewLine({
                                sublistId: 'item'
                            });
                            recEstimate.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                value: idDiscount,
                                ignoreFieldChange: false
                            });
                            recEstimate.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'price',
                                value: -1,
                                ignoreFieldChange: true
                            });

                            recEstimate.setCurrentSublistText({
                                sublistId: 'item',
                                fieldId: 'rate',
                                text: nDiscountAmout,
                                ignoreFieldChange: false
                            });

                            recEstimate.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_atl_usdrate',
                                value: discount.amount,
                                ignoreFieldChange: false
                            });

                            recEstimate.commitLine({
                                sublistId: 'item'
                            });

                            recEstimate.selectNewLine({
                                sublistId: 'item'
                            });
                            recEstimate.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                value: SUBTOTAL,
                                ignoreFieldChange: false
                            });
                            recEstimate.commitLine({
                                sublistId: 'item'
                            });

                        }

                    });
                });


                if (objError) {


                    recOpp = record.load({
                        type: record.Type.OPPORTUNITY,
                        id: idOpportunity
                    });

                    if (recOpp.getLineCount({
                        sublistId: 'estimates'
                    }) > 0) {

                        for (var nLine = 0; nLine < recOpp.getLineCount({
                            sublistId: 'estimates'
                        }); nLine++) {

                            fldEstimate.addSelectOption({
                                value: recOpp.getSublistValue({
                                    sublistId: 'estimates',
                                    fieldId: 'id',
                                    line: nLine
                                }),
                                text: recOpp.getSublistValue({
                                    sublistId: 'estimates',
                                    fieldId: 'tranid',
                                    line: nLine
                                })
                            });

                        }
                    } else {
                        fldEstimate.updateDisplayType({
                            displayType: 'HIDDEN'
                        });
                    }

                    var sUser = 'User: ' + runtime.getCurrentUser().name + '. ';
                    var sOpportunity = 'Opportunity: ' + recOpp.getValue('tranid') + '.';
                    var sMessage = 'Unable to create Estimate: ' + objError.message;
                    var sNotification = sMessage;
                    sNotification += sUser;
                    sNotification += sOpportunity;

                    sMessage += 'The administrator has been notified.';


//                	jira.createTicket({
//	                    'payload': {
//	                    	 'serviceDeskId': '2',
//	                    	  'requestTypeId': '313',
//	                    	  'requestFieldValues': {
//	                    	    'summary': 'Missing Matrix Item',
//	                    	    'description': sNotification,
//	                    	    'customfield_10077': [{
//	                    	        'value': 'S251 NetSuite'
//	                    	    }]
//	                    	  }
//	                    	}
//	                });

                    email.send({
                        author: runtime.getCurrentUser().id,
                        recipients: 171596,
                        subject: 'Missing Matrix Item',
                        body: sNotification
                    });

                    fldMessage.defaultValue = sMessage;
                    context.response.writePage(objForm);
                } else {

                    recEstimate.setValue({
                        fieldId: 'custbody_order_type',
                        value: idOrderType
                    });

                    idEstimate = recEstimate.save();

                    record.attach({
                        record: {
                            type: 'file',
                            id: idFile
                        },
                        to: {
                            type: record.Type.ESTIMATE,
                            id: idEstimate
                        }
                    });

                    recEstimate = record.load({
                        type: record.Type.ESTIMATE,
                        id: idEstimate
                    });
                    recOpp = record.load({
                        type: record.Type.OPPORTUNITY,
                        id: idOpportunity
                    });

                    if (recOpp.getLineCount({
                        sublistId: 'estimates'
                    }) > 0) {

                        var isSelected;

                        for (var nLine = 0; nLine < recOpp.getLineCount({
                            sublistId: 'estimates'
                        }); nLine++) {

                            if (recOpp.getSublistValue({
                                sublistId: 'estimates',
                                fieldId: 'id',
                                line: nLine
                            }) == idEstimate) {
                                isSelected = true;
                            } else {
                                isSelected = false;
                            }

                            fldEstimate.addSelectOption({
                                value: recOpp.getSublistValue({
                                    sublistId: 'estimates',
                                    fieldId: 'id',
                                    line: nLine
                                }),
                                text: recOpp.getSublistValue({
                                    sublistId: 'estimates',
                                    fieldId: 'tranid',
                                    line: nLine
                                }),
                                isSelected: isSelected
                            });
                        }
                    }

                    fldMessage.defaultValue = 'Estimate <a href="/app/accounting/transactions/estimate.nl?id=' + idEstimate + '&whence=" target="_blank">' + recEstimate.getValue({
                        fieldId: 'tranid'
                    }) + '</a> has been ' + sAction + '';

                    context.response.writePage(objForm);
                }
            }
        }

        isoToNSdate = function (sIso) {
            var arrDue = (sIso.split('T')[0]).split('-');
            return arrDue[1] + '/' + arrDue[2] + '/' + arrDue[0];
        };

        getAllResults = function (s) {
            var results = s.run();
            var searchResults = [];
            var searchid = 0;
            do {
                var resultslice = results.getRange({start: searchid, end: searchid + 1000});
                resultslice.forEach(function (slice) {
                        searchResults.push(slice);
                        searchid++;
                    }
                );
            } while (resultslice.length >= 1000);
            return searchResults;
        };


        return {
            onRequest: onRequest
        };

    });
