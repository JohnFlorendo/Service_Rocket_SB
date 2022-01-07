/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget','N/https','N/render','N/encode','N/file'],

function(serverWidget,https,render,encode,file) {
    function onRequest(context) {
        if(context.request.method == 'GET') {
            try {
                var response = https.get({
                    url: 'https://nfe.prefeitura.sp.gov.br/contribuinte/notaprint.aspx?ccm=45516308&nf=549558&cod=KXHTDJ4G'
                });
                var xmlStr = response.body;
               /* var base64EncodedString = encode.convert({
                    string: xmlStr,
                    inputEncoding: encode.Encoding.UTF_8,
                    outputEncoding: encode.Encoding.BASE_64
                });
                /!*log.debug('base64EncodedString', base64EncodedString);
                /!*xmlStr = xmlStr.replace(/&/g, "&amp;");
                xmlStr = xmlStr.replace(/</g, "&lt;");
                xmlStr = xmlStr.replace (/>/g, "&gt;");
                xmlStr = xmlStr.replace (/"/g, "&quot;");
                xmlStr = xmlStr.replace (/'/g, "&apos;"); *!/
                log.debug('xmlStr', xmlStr);
                log.debug('body', response.body)

                var pdfFile = render.xmlToPdf({
                    xmlString: xmlStr.toString()
                });*!/*/

                var stContent = 'DQoNCjxpbnB1dCB0eXBlPSJoaWRkZW4iIG5hbWU9Il9fVklFV1NUQVRFR0VORVJBVE9SIiBpZD0iX19WSUVXU1RBVEVHRU5FUkFUT1IiIHZhbHVlPSJDM0RGMzk0NSIgLz4NCjxpbnB1dCB0eXBlPSJoaWRkZW4iIG5hbWU9Il9fRVZFTlRWQUxJREFUSU9OIiBpZD0iX19FVkVOVFZBTElEQVRJT04iIHZhbHVlPSIvd0VkQUFNczBsQzNPSXpYR0h4aU9GZmlZTGdFSlNjUmpBNUxtbTM4U3hLNXkzQ3B3SzNRNlpCMFFvSGxMcUJ6NDl3aFY2VW5kZzkwcmR4bFpNQVlIY2VsZENVN2JPUStsZz09IiAvPg0KICAgIDxkaXYgc3R5bGU9ImRpc3BsYXk6YmxvY2siPg0KICAgICAgICANCiAgICA8c2NyaXB0IHR5cGU9InRleHQvamF2YXNjcmlwdCIgbGFuZ3VhZ2U9IkphdmFzY3JpcHQiPg0KCSAgICBmdW5jdGlvbiBCb2R5T25Mb2FkKCkNCgkgICAgew0KCQkgICAgdmFyIGEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3RsMDBfY3BoQmFzZV9wbkFndWFyZGUnKTsNCgkJICAgIHZhciBiID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2N0bDAwX2NwaEJhc2VfcG5Cb3RvZXMnKTsNCgkJICAgIHZhciBpID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2N0bDAwX2NwaEJhc2VfYnRJbXByaW1pcicpOw0KICAgICAgICAgICAgdmFyIHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3RsMDBfY3BoQmFzZV9pbWcnKTsNCgkJICAgIGEuc3R5bGUuZGlzcGxheT0nbm9uZSc7DQoJCSAgICBiLnN0eWxlLmRpc3BsYXk9J2lubGluZSc7DQoJCSAgICBzLnN0eWxlLmRpc3BsYXk9J2lubGluZSc7DQoJCSAgICBpLmZvY3VzKCk7DQoJCX0NCg0KCQlmdW5jdGlvbiBSZXRvcm5vQWNlaXRlTWFuaWZlc3RhY2FvKG5mLGNjbSkgew0KCQkgICAgdmFyIHJldG9ybm8gPSAib2siICsgInwiICsgY2NtICsgInwiICsgbmY7ICAgIA0KCQkgICAgICAgIGlmICh3aW5kb3cub3BlbmVyICE9IG51bGwgJiYgIXdpbmRvdy5vcGVuZXIuY2xvc2VkKSB7DQoJCSAgICAgICAgICAgIHdpbmRvdy5vcGVuZXIuQ2FsbEFjZWl0ZU1hbmlmZXN0YWNhbyhyZXRvcm5vKTsgICANCgkJICAgICAgICB9CQkNCgkJfQ0KCSAgICANCg0KCSAgICBmdW5jdGlvbiBJbXByaW1pcigpDQoJICAgIHsNCgkJICAgIHdpbmRvdy5wcmludCgpOw0KCSAgICB9DQoJICAgIA0KCSAgICBmdW5jdGlvbiBDZW50ZXJXaW5kb3dQb3Mod2lkdGgsIGhlaWdodCkgew0KCSAgICAgICAgdmFyIHgseTsNCgkgICAgICAgIHg9KHNjcmVlbi5hdmFpbFdpZHRoLXdpZHRoKS8';

             /*   var renderer = render.create();
                renderer.templateContent = escapeRegExp(xmlStr);
                var objFile = renderer.renderAsPdf();
                objFile.name = 'test1';
                objFile.isOnline = true;
                objFile.folder = -4;
                objFile.save();*/
                var pdfContent = file.create({
                    name: 'test1',
                    fileType: file.Type.HTMLDOC,
                    contents: xmlStr
                })
                pdfContent.folder = -4;
                var htmlId = pdfContent.save();

                if(htmlId){

                    var flHTML = file.load({
                        id : htmlId
                    });
                    var form = serverWidget.createForm({
                        title : ' '
                    });

                    form.addField({
                        id: 'custpage_inlinehtml',
                        type : serverWidget.FieldType.INLINEHTML,
                        label : 'test'
                    }).defaultValue = xmlStr;

                    context.response.writePage(form);
                    /*var flHTML = file.load({
                        id : htmlId
                    });
                    var renderer = render.create();
                    renderer.templateContent = escapeRegExp(flHTML.getContents());

                    var htmlContent = file.create({
                        name: 'test2',
                        fileType: file.Type.HTMLDOC,
                        contents: renderer.renderAsString()
                    })
                    htmlContent.folder = -4;
                    var htmlId = htmlContent.save();

                   /!* renderer.templateContent = renderer.renderAsString()
                    var objFile = renderer.renderAsPdf();
                    objFile.name = 'test3';
                    objFile.isOnline = true;
                    objFile.folder = -4;
                    objFile.save();*!/
                    context.response.renderPdf(xmlStr)*/
                }


                context.response.write('saved');
            } catch (e) {
                log.debug('Error : Get', e);
            }
        }
    }
    function escapeRegExp(string) {
        return string.replace(/&/g, '&amp;');
    }

    return {
        onRequest: onRequest
    };
    
});