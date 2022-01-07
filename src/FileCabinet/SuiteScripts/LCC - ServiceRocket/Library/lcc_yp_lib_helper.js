define(['N/record', 'N/render','N/file','N/search','N/xml'],
/**
 * @param{runtime} runtime
 * @param{search} search
 * @param{url} url
 * @param{https} https
 * @param{file} file
 * @param{render} render
 */
function(record, render,file,search,xml) {
    var libFunction = {};
    libFunction.generatePDF = function (invId,folderId) {
        try{
            var xmlStr = '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
            xmlStr += '<pdfset>';
            xmlStr += renderTrans(invId);
            xmlStr += '</pdfset>';
            //log.debug('generatePDF=>xmlStr',xmlStr);
            if(folderId){
                 downloadPDF(invId,xmlStr,folderId);
            }

            return xmlStr;

        }catch (e) {
            log.debug('generatePDF',e);
        }
    }

    libFunction.searchAllInvoices = function () {
        var arrInvoices = [];
        try{
            var invoiceSearchObj = search.create({
                type: search.Type.INVOICE,
                filters:
                    [
                        ["type","anyof","CustInvc"],
                        "AND",
                        ["status","anyof","CustInvc:A"],
                        "AND",
                        ["mainline","is","T"],
                        /*"AND",
                        ["internalid","anyof",['1587895','1586251','1585707']]*/
                    ],
                columns:
                    [
                        "entity"
                    ]
            });

            var myPagedData = invoiceSearchObj.runPaged({
                pageSize: 1000
            });

            try {
                myPagedData.pageRanges.forEach(function(pageRange) {
                    var myPage = myPagedData.fetch({
                        index: pageRange.index
                    });
                    myPage.data.forEach(function(result) {
                        var tranId = result.id;
                        var entityId = result.getValue('entity');
                        arrInvoices.push({
                            id : tranId,
                            entityId : entityId
                        });
                    });
                });
            } catch (e) {
                log.debug(e);
            }
        }catch (e) {

        }

        return arrInvoices;
    }

    function downloadPDF(tranid,xmlStr,folderId) {
        var isDownload = false;
        try{
            var recInvoice = record.load({
                type: record.Type.INVOICE,
                id: tranid
            });
            var fileName = 'invoice_'+ recInvoice.getValue('tranid') + '.pdf';
            //log.debug('xmlStr',xmlStr);

            var renderer = render.create();
            renderer.templateContent = xmlStr;
            var invoicePdf = renderer.renderAsPdf();
            var fileObj = file.create({
                name: fileName,
                fileType: file.Type.PDF,
                contents : invoicePdf.getContents()
            });
            fileObj.folder = folderId;
            var fileId = fileObj.save();
            log.debug('Downloaded File',fileId);
            if(fileId){
                isDownload = true;
                //UPDATE YP PDF
                record.submitFields({
                    type : 'invoice',
                    id : tranid,
                    values : {
                        custbody_yp_pdf : fileId
                    }
                })
            }
        }catch (e) {
            log.debug('downloadPDF',e);
        }

        return isDownload
    }
    function  getURL(stScript,stDeployment) {
        var urlLink =  url.resolveScript({
            scriptId: stScript,
            deploymentId: stDeployment,
            returnExternalUrl: true
        });

        return urlLink;
    }

    function renderTrans(tranid) {
        var tmpPage1 = file.load({id : '../Template/service_rocket_invoice_1.html'});
        var tmpPage2 = file.load({id : '../Template/service_rocket_invoice_2.html'});

        var recInvoice = record.load({
            type: record.Type.INVOICE,
            id: tranid
        });


        var stInvoiceNumber = recInvoice.getValue({
            fieldId: 'tranid'
        });

        var stTranDate = recInvoice.getValue({
            fieldId: 'trandate'
        });

        var stDueDate = recInvoice.getValue({
            fieldId: 'duedate'
        });

        var stReportDate = stTranDate + '-' + stDueDate;



        var stProject = recInvoice.getValue({
            fieldId: 'job'
        });

        var stProjectText = recInvoice.getText({
            fieldId: 'job'
        });



        var arrCharges = [];
        if(stProject){
            var fieldLookUp = search.lookupFields({
                type: search.Type.JOB,
                id: stProject,
                columns: ['custentity_sr_charge_details']
            });

            //CHECK IF INCLUDE DETAILS
            if(fieldLookUp.custentity_sr_charge_details){
                arrCharges = getCharges(stProject,tranid);
            }
        }

        var recSubsidiary = record.load({
            type: record.Type.SUBSIDIARY,
            id: recInvoice.getValue({
                fieldId: 'subsidiary'
            })
        });

        var renderer = render.create();
        renderer.templateContent = tmpPage1.getContents();
        //REPLACE THE LINE ITEM IN PAGE 1
        var stDuration = getReportDuration(recInvoice);
        //var stSublistHTML = buildItemSublist(recInvoice);
        var stSublistHTML = buildItemSublistByType(recInvoice);
        renderer.templateContent = renderer.templateContent.replace('{stDuration}',stDuration);
        renderer.templateContent = renderer.templateContent.replace('{stSublistHTML}',stSublistHTML);
        if(arrCharges.length > 0){
            renderer.templateContent += tmpPage2.getContents();
            var stHTML = buildChargeTable(arrCharges);
            var stTotalHour = getTotal(arrCharges).totalHour;
            var stTotalAmount = getTotal(arrCharges).totalAmount;
            renderer.templateContent = renderer.templateContent.replace('{stDuration}',stDuration);
            renderer.templateContent = renderer.templateContent.replace('{arrCharges}',stHTML);
            renderer.templateContent = renderer.templateContent.replace('{totalHours}',stTotalHour);
            renderer.templateContent = renderer.templateContent.replace('{totalAmount}',numberWithCommas(stTotalAmount.toFixed(2)));

        }

        renderer.addRecord('record',recInvoice);
        renderer.addRecord('subsidiary',recSubsidiary);
        // log.debug('renderer.templateContent',renderer.templateContent);

        return escapeRegExp(renderer.renderAsString())
    }

    function buildChargeTable(arrCharges) {

        var totalHour = 0;
        var totalAmount = 0;
        var htmlTable = '';
        htmlTable += '<table style="width: 100%; margin-top: 10px; margin-left: 0.4in; margin-right: 0.4in; font-size: 11pt; border-collapse: collapse; font-size: 11px;">';
        htmlTable += '<tr style="background-color: #F5F5F5; color: #AAAAAA; font-weight: bold; font-size: 11px;">';
        htmlTable += '    <td width="10%" >Date</td>';
        htmlTable += '    <td width="10%" >Employee</td>';
        htmlTable += '    <td width="10%" >Item</td>';
        htmlTable += '    <td width="45%" >Memo</td>';
        htmlTable += '    <td align="right" width="5%" >Time</td>';
        htmlTable += '    <td align="right" width="10%" >Rate</td>';
        htmlTable += '    <td align="right" width="10%" >Amount</td>';
        htmlTable += '</tr>';

        var count = 0;
        var page = false;
        var pagecount = 0;
        var totalpage = 0;
        for(var indx = 0; indx < arrCharges.length; indx++){

            if(pagecount == 0){
                if(count == 10){
                    page = true;
                    count = 0;
                    pagecount++;
                }
            }else{
                if(count == 15){
                    page = true;
                    count = 0;
                    pagecount++;
                }
            }

            if(page){
                htmlTable += '<tr style="border-bottom: 0.10px solid #AAAAAA; line-height:200%; margin-top: 0.5in;">';
                page = false;
            }else {
                htmlTable += '<tr style="border-bottom: 0.10px solid #AAAAAA; line-height:200%; ">';
            }

            htmlTable += '    <td align="left" style="white-space: nowrap">' + arrCharges[indx].date +'</td>';
            htmlTable += '    <td align="left" style="white-space: nowrap">' + arrCharges[indx].employee +'</td>';
            htmlTable += '    <td align="left" >' + arrCharges[indx].item +'</td>';
            htmlTable += '    <td align="left">' + arrCharges[indx].memo +'</td>';
            htmlTable += '    <td align="right">' + arrCharges[indx].time +'</td>';
            htmlTable += '    <td align="right">' + arrCharges[indx].rate +'</td>';
            htmlTable += '    <td align="right">' + arrCharges[indx].amount +'</td>';
            htmlTable += '</tr>';

            totalHour += Number(arrCharges[indx].time);
            totalAmount += Number(arrCharges[indx].amount);

            count++;
            totalpage++;
        }

        htmlTable += '<tr style="font-size: 12pt">';
        htmlTable += '    <td></td>';
        htmlTable += '    <td></td>';
        htmlTable += '    <td></td>';
        htmlTable += '    <td align="right">Total</td>';
        htmlTable += '    <td align="right">' + totalHour+'</td>';
        htmlTable += '    <td align="right" colspan="2">' + numberWithCommas(totalAmount.toFixed(2)) +'</td>';
        htmlTable += '</tr>';


        htmlTable += '</table>';

        return htmlTable;

    }

    function  buildItemSublistByType(recInvoice) {
        var objSublistItems = {};
        var stHTML = '';
        var stSubsidiary = recInvoice.getValue('subsidiary');
        var intLine = recInvoice.getLineCount('item');

        var hasDiscount = false;
        for(var indxLine = 0; indxLine < intLine; indxLine++){
            var stItemId = recInvoice.getSublistValue('item','item',indxLine);
            var stItemType = recInvoice.getSublistValue('item','itemtype',indxLine);
            var stItemName = recInvoice.getSublistText('item','item',indxLine);
            var stDescription = recInvoice.getSublistValue('item','description',indxLine);
            var stQty = recInvoice.getSublistValue('item','quantity',indxLine);
            var stRate = recInvoice.getSublistValue('item','rate',indxLine);
            var stTaxAmount = (recInvoice.getSublistValue('item','tax1amt',indxLine)) ? recInvoice.getSublistValue('item','tax1amt',indxLine) : 0;
            var stAmount = recInvoice.getSublistValue('item','amount',indxLine);
            var stGrossAmount = recInvoice.getSublistValue('item','grossamt',indxLine);

            if(stGrossAmount){
                if(stItemType == 'Discount'){
                    hasDiscount = true;
                }
            }

            var stDescTrim = stDescription.trim();
            if(objSublistItems[indxLine] == null){
                objSublistItems[indxLine] = {
                    'name' : stItemName,
                    'description' : stDescription,
                    'quantity' : stQty,
                    'tax' : stTaxAmount,
                    'rate' : stRate,
                    'amount' : stAmount,
                    'gross_amount' : stGrossAmount
                }
            }



        }

        if(hasDiscount){
            stHTML += buildRowsForDiscount(objSublistItems,stSubsidiary);
        }else{
            stHTML += buildRowsForNonDiscount(objSublistItems,stSubsidiary);
        }

        return stHTML;
    }

    function buildRowsForNonDiscount(objSublistItems,stSubsidiary) {

        var stHTMLRows = ''
        var count = 1;
        var totalDiscountLength = 0;
       // log.debug('buildRowsForNonDiscount=>objSublistItems',objSublistItems);
        for (var item in objSublistItems){
            totalDiscountLength += objSublistItems[item].description.length;
            var stDescription = objSublistItems[item].description; //JSON.stringify(objSublistItems[item].description);
            stDescription = stDescription.replace(/\n/g, "<br />");
            /* var arrDescription = objSublistItems[item].description.split('-Support');
             if(arrDescription.length > 1){
                 stDescription = arrDescription[0] + '<br/> -Support' + arrDescription[1];
             }else{
                 stDescription = objSublistItems[item].description;
             }*/
            var qty =  Number(objSublistItems[item].quantity).toFixed(2);
            var rate = Number(objSublistItems[item].rate).toFixed(2);
            var tax = Number(objSublistItems[item].tax).toFixed(2);
            var amount = Number(objSublistItems[item].amount).toFixed(2);

            if(totalDiscountLength < 400){
                stHTMLRows += '<tr>';
                stHTMLRows += '<td>'+count+'</td>';
                stHTMLRows += '<td> <p>'+stDescription+'</p></td>';
                stHTMLRows += '<td align="right">'+numberWithCommas(qty)+'</td>';
                stHTMLRows += '<td align="right">'+numberWithCommas(rate)+'</td>';
                if(stSubsidiary != 8){
                    stHTMLRows += '<td align="right">'+numberWithCommas(tax)+'</td>';
                }

                stHTMLRows += '<td align="right">'+numberWithCommas(amount)+'</td>';
                stHTMLRows += '</tr>';
            }else {
                stHTMLRows += '<tr style="margin-top: 0.4in">';
                stHTMLRows += '<td>'+count+'</td>';
                stHTMLRows += '<td>'+stDescription+'</td>';
                stHTMLRows += '<td align="right">'+numberWithCommas(qty)+'</td>';
                stHTMLRows += '<td align="right">'+numberWithCommas(rate)+'</td>';
                if(stSubsidiary != 8) {
                    stHTMLRows += '<td align="right">' + numberWithCommas(tax) + '</td>';
                }
                stHTMLRows += '<td align="right">'+numberWithCommas(amount)+'</td>';
                stHTMLRows += '</tr>';
            }

            count++;
        }

        return stHTMLRows;

    }

    function buildRowsForDiscount(objSublistItems,stSubsidiary) {
      //  log.debug('buildRowsForDiscount=>objSublistItems',objSublistItems);
        var stHTMLRows = ''
        var count = 1;
        var totalDiscountLength = 0;
        for (var item in objSublistItems){
            totalDiscountLength += objSublistItems[item].description.length;
            var stDescription = objSublistItems[item].description; //JSON.stringify(objSublistItems[item].description);
            stDescription = stDescription.replace(/\n/g, "<br />");

            var qty =  Number(objSublistItems[item].quantity).toFixed(2);
            var amount = Number(objSublistItems[item].amount).toFixed(2);
            var tax = Number(objSublistItems[item].tax).toFixed(2);
            var gross_amount = Number(objSublistItems[item].gross_amount).toFixed(2);


            if(totalDiscountLength < 400){
                stHTMLRows += '<tr>';
                stHTMLRows += '<td>'+count+'</td>';
                stHTMLRows += '<td><p>'+stDescription+'</p></td>';
                stHTMLRows += '<td align="right">'+numberWithCommas(qty)+'</td>';
                stHTMLRows += '<td align="right">'+numberWithCommas(amount)+'</td>';
                if(stSubsidiary != 8) {
                    stHTMLRows += '<td align="right">' + numberWithCommas(tax) + '</td>';
                }
                stHTMLRows += '<td align="right">'+numberWithCommas(gross_amount)+'</td>';
                stHTMLRows += '</tr>';
            }else{
                stHTMLRows += '<tr style="margin-top: 0.4in">';
                stHTMLRows += '<td>'+count+'</td>';
                stHTMLRows += '<td><p>'+stDescription+'</p></td>';
                stHTMLRows += '<td align="right">'+numberWithCommas(qty)+'</td>';
                stHTMLRows += '<td align="right">'+numberWithCommas(amount)+'</td>';
                if(stSubsidiary != 8) {
                    stHTMLRows += '<td align="right">'+numberWithCommas(tax)+'</td>';
                }
                stHTMLRows += '<td align="right">'+numberWithCommas(gross_amount)+'</td>';
                stHTMLRows += '</tr>';
            }

            count++;
        }

        return stHTMLRows;

    }

    function buildItemSublist(recInvoice){
        var objItems = {};
        var stHTML = '';
        var intLine = recInvoice.getLineCount('item');
        for(var indxLine = 0; indxLine < intLine; indxLine++){
            var stItemId = recInvoice.getSublistValue('item','item',indxLine);
            var stItemName = recInvoice.getSublistText('item','item',indxLine);
            var stDescription = recInvoice.getSublistValue('item','description',indxLine);
            var stQty = recInvoice.getSublistValue('item','quantity',indxLine);
            var stRate = recInvoice.getSublistValue('item','rate',indxLine);
            var stTaxAmount = (recInvoice.getSublistValue('item','tax1amt',indxLine)) ? recInvoice.getSublistValue('item','tax1amt',indxLine) : 0;
            var stAmount = recInvoice.getSublistValue('item','amount',indxLine);

            var stDescTrim = stDescription.trim();
            if(objItems[stDescTrim] == null){
                objItems[stDescTrim] = {
                    'name' : stItemName,
                    'description' : stDescription,
                    'quantity' : 0,
                    'tax' : 0,
                    'rate' : 0,
                    'amount' : 0
                }
            }

            objItems[stDescTrim].quantity += stQty;
            objItems[stDescTrim].tax += stTaxAmount;
            objItems[stDescTrim].rate += stRate;
            objItems[stDescTrim].amount += stAmount;
        }
        stHTML += '<tr style="background-color: #F5F5F5; color: #AAAAAA; font-weight: bold;">';
        stHTML +=    '<td width="5%">No.</td>';
        stHTML +=    '<td width="50%">Description</td>';
        stHTML +=    '<td align="right" width="9%">Qty</td>';
        stHTML +=    '<td align="right" width="13%">Amount</td>';
        stHTML +=    '<td align="right" width="12%">GST</td>';
        stHTML +=    '<td align="right" width="15%" style="white-space: nowrap">Gross Amount</td>';
        stHTML += '</tr>';

        var count = 1;
        for (var item in objItems){
            stHTML += '<tr>';
            stHTML += '<td>'+count+'</td>';
            stHTML += '<td>'+objItems[item].description+'</td>';
            stHTML += '<td align="right">'+Number(objItems[item].quantity).toFixed(2)+'</td>';
            stHTML += '<td align="right">'+Number(objItems[item].rate).toFixed(2)+'</td>';
            stHTML += '<td align="right">'+Number(objItems[item].tax).toFixed(2)+'</td>';
            stHTML += '<td align="right">'+Number(objItems[item].amount).toFixed(2)+'</td>';
            stHTML += '</tr>';
            count++;
        }

        return stHTML;
    }


    function getCharges(stProject,stInvoice) {
        if(stProject){
            var arrCharges = [];
            var chargeSearchObj = search.create({
                type: "charge",
                filters:
                    [
                        ["job.internalid","anyof",stProject],
                        "AND",
                        ["use","anyof","Actual"],
                        "AND" ,
                        ["invoice.internalid","anyof",stInvoice]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "use",
                            sort: search.Sort.ASC,
                            label: "Charge Use"
                        }),
                        search.createColumn({name: "chargetype", label: "Charge Type"}),
                        search.createColumn({name: "id", label: "Charge ID"}),
                        search.createColumn({name: "billto", label: "Customer:Project"}),
                        search.createColumn({name: "rate", label: "Rate"}),
                        search.createColumn({name: "quantity", label: "Quantity"}),
                        search.createColumn({name: "amount", label: "Amount"}),
                        search.createColumn({name: "chargedate", label: "Date"}),
                        search.createColumn({name: "billdate", label: "Bill Date"}),
                        search.createColumn({name: "servicestartdate", label: "Service Start Date"}),
                        search.createColumn({name: "serviceenddate", label: "Service End Date"}),
                        search.createColumn({name: "modifieddate", label: "Date Modified"}),
                        search.createColumn({name: "salesorder", label: "Sales Order Id"}),
                        search.createColumn({name: "stage", label: "Charge Stage"}),
                        search.createColumn({name: "runid", label: "Charge Run ID"}),
                        search.createColumn({name: "postingperiod", label: "Posting Period"}),
                        search.createColumn({name: "billingschedule", label: "Billing Schedule"}),
                        search.createColumn({name: "billingmode", label: "Billing Mode"}),
                        search.createColumn({name: "description", label: "Description"}),
                        search.createColumn({name: "memo", label: "Memo"}),
                        search.createColumn({name: "grouporder", label: "Group Order"}),
                        search.createColumn({name: "chargeemployee", label: "Employee"}),
                        search.createColumn({name: "billingitem", label: "Item"}),
                        search.createColumn({
                            name: "durationdecimal",
                            join: "time",
                            label: "Duration (Decimal)"
                        }),
                        search.createColumn({
                            name: "displayname",
                            join: "item",
                            label: "Display Name"
                        }),
                        search.createColumn({
                            name: "firstname",
                            join: "chargeEmployee",
                            label: "First Name"
                        }),
                        search.createColumn({
                            name: "lastname",
                            join: "chargeEmployee",
                            label: "Last Name"
                        })

                    ]
            });
            var searchResultCount = chargeSearchObj.runPaged().count;
            //log.debug("chargeSearchObj result count",searchResultCount);
            chargeSearchObj.run().each(function(result){
                var stDisplay = result.getValue({
                    name: 'displayname',
                    join: 'item'
                });
                var stEmpFname = result.getValue({
                    name: 'firstname',
                    join: 'chargeEmployee'
                });
                var stEmpLname = result.getValue({
                    name: 'lastname',
                    join: 'chargeEmployee'
                });

                var stEmployee=  stEmpFname + '<br/>' + stEmpLname;

                var itemName = (stDisplay != '')? stDisplay : result.getText('billingitem');
                var objCharge = {};
                objCharge.customer = result.getText('billto');
                objCharge.date = result.getValue('billdate');
                objCharge.employee = stEmployee; //result.getValue('chargeemployee');
                objCharge.item = itemName;
                objCharge.memo = result.getValue('memo');
                objCharge.rate = result.getValue('rate');
                objCharge.amount = result.getValue('amount');
                objCharge.time = result.getValue({
                    name: 'durationdecimal',
                    join: 'time'
                });

                arrCharges.push(objCharge);
                return true;
            });

            return arrCharges;
        }
    }

    function numberWithCommas(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function  getTotal(arrCharges) {
        var objResults = {};
        objResults.totalHour = 0;
        objResults.totalAmount = 0;
        for(var indx = 0; indx < arrCharges.length; indx++){
            objResults.totalHour += Number(arrCharges[indx].time);
            objResults.totalAmount += Number(arrCharges[indx].amount);
        }
        return objResults;
    }

    function getReportDuration(recInvoice) {

        var stDuration = "";
        var dtStartDate = recInvoice.getValue('startdate');
        var dtEndDate = recInvoice.getValue('enddate');

        if(dtStartDate && dtEndDate){
            var sdate = new Date(dtStartDate);
            var edate = new Date(dtEndDate);
            var stStart = sdate.getDate() + '-' + monthConvertToString[sdate.getMonth()] + '-' + sdate.getFullYear().toString().substr(-2);
            var stEnd = edate.getDate() + '-' + monthConvertToString[edate.getMonth()] + '-' + edate.getFullYear().toString().substr(-2);
            stDuration = stStart + ' - ' + stEnd;
        }else{
            var dtTrandate = recInvoice.getValue('trandate');
            var date = new Date(dtTrandate);
            var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
            var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            var stFirst = firstDay.getDate() + '-' + monthConvertToString[firstDay.getMonth()] + '-' + firstDay.getFullYear().toString().substr(-2);
            var stLast = lastDay.getDate() + '-' + monthConvertToString[lastDay.getMonth()] + '-' + lastDay.getFullYear().toString().substr(-2);
            stDuration = stFirst + ' - ' + stLast;
        }

        return stDuration;
    }

    function escapeRegExp(string) {
        return string.replace(/&/g, '&amp;');
    }

    var monthConvertToString = {
        0 : 'Jan',
        1 : 'Feb',
        2 : 'Mar',
        3 : 'Apr',
        4 : 'May',
        5 : 'Jun',
        6 : 'Jul',
        7 : 'Aug',
        8 : 'Sep',
        9 : 'Oct',
        10 : 'Nov',
        11 : 'Dec'
    }

    return libFunction;
});
