/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope TargetAccount
 */
define([ 'N/record', 'N/https' , 'N/redirect','N/search','N/runtime','N/format'  ],

function(record, https, redirect,search,runtime,format) {

	/**
	 * Definition of the Suitelet script trigger point.
	 * 
	 * @param {Object}
	 *            context
	 * @param {ServerRequest}
	 *            context.request - Encapsulation of the incoming request
	 * @param {ServerResponse}
	 *            context.response - Encapsulation of the Suitelet response
	 * @Since 2015.2
	 */
	function onRequest(context) {
		try {
            log.debug('onRequest : ');

    		var i_recId =context.request.parameters.i_recId;
            log.debug('i_recId : ', i_recId);

            var i_recType =context.request.parameters.i_recType;
            log.debug('i_recType : ', i_recType);
    		
			var objRec = record.load({type : i_recType,id : i_recId});
			
			var ewaystatus = objRec.getValue({fieldId:'custbody_in_eway_export_status'});
          log.debug*('ewaystatus',ewaystatus);
            var ewayno = objRec.getValue({fieldId:'custbody_in_eway_bill_no'});
                    log.debug*('ewayno',ewayno);

            if(ewaystatus == 1 &&  (ewayno == null || ewayno == 'null' || ewayno == "") )
            {
                var response = GenerateEWayBill(objRec,i_recId, i_recType);
                log.debug('response : ', response);
            }
            
            redirect.toRecord({
                type: i_recType,
                id: i_recId
           });
		}
		catch (ex) {
			log.error(ex.name, ex.message);
		}

	}


	function GenerateEWayBill(objRec,i_recId, i_recType)
	{
		var Reqresponse = {}
		try
		{
			var requestURL = "https://api.clear.in/einv/v3/ewaybill/generate";
			
			//var apiKey = "1.0a4dfef8-6dfa-4160-a21c-c3c390a58e6d_7d2a294c74921b9ff80062ff5e3383834aa8cb5c17bdb64b89f7fd6cc8fcc26b"
            var apiKey = "1.0eb9341d-7c09-45b6-bf6b-990bc5c9f41c_8ce2942dcac053d671a52e0ce48573bafbce18269d1fcef266dd84b72c95869a"
              //"1.5c1744c2-452c-4565-a78e-8e19746a819e_1e5ac994474ecb9e8c1896346be294f5dfc2177be23461027f517826cc3cad68"
              //"1.786272f9-4547-47d3-b76f-03573850b0fa_e8fdcfa4cbe971cd7f7b9982d857bb56964203363d368b16f4b6eeaa7e01d544"
			//"1.67a08ab1-bfb5-41d2-b9f5-6b56b51c8927_0b0dcfdcb7ff2583d256de34eb581ba7a493ac956757ab9c583dfeeda6d0948a"
			
            
            var gstin = objRec.getValue({fieldId:'custbody_from_location_gstin'});
			var subId = objRec.getValue({
				fieldId : 'subsidiary'
			})
			 var subsidiarySearchObj = search.create({
   type: "subsidiary",
   filters:
   [
      ["internalid","anyof",subId]
   ],
   columns:
   [
    
      search.createColumn({name: "taxregistrationnumber", label: "Tax Reg. Number"}),
    
   ]
});
var searchResultCount = subsidiarySearchObj.runPaged().count;
log.debug("subsidiarySearchObj result count",searchResultCount);
 var results = subsidiarySearchObj.run().getRange({start : 0, end   : 1000})
	    var gstiN = results[0].getValue({name: "taxregistrationnumber",label: "Name"});
		  
			var requestheaders  = 
				{
					'x-cleartax-auth-token' : apiKey,
					'Accept'				: 'application/json',
					'gstin'               	: gstiN,
					'Content-Type'          : 'application/json'
				}
           
            var  requestbody = {};
            requestbody = GetPartARequestBody(objRec,i_recId)
            log.debug('Part A requestbody : ', requestbody);
         
            var response = ''
                    if (requestbody) {
                        var response = https.request({
                            method: https.Method.PUT,
                            url: requestURL,
                            body: requestbody,
                            headers: requestheaders
                        });
                        //var response = {"type":"http.ClientResponse","code":200,"headers":{"Content-Length":"1463","content-length":"1463","Content-Type":"application/json","content-type":"application/json","Date":"Tue, 11 Jul 2023 06:52:33 GMT","date":"Tue, 11 Jul 2023 06:52:33 GMT","Via":"1.1 mono001.prod-kix-ap4.core.ns.internal","via":"1.1 mono001.prod-kix-ap4.core.ns.internal","x-ratelimit-limit":"26","X-Ratelimit-Limit":"26","x-ratelimit-remaining":"25","X-Ratelimit-Remaining":"25","x-ratelimit-reset":"1","X-Ratelimit-Reset":"1","x-request-id":"_0addab42-618f-43dc-bf46-7232d0ee61e7","X-Request-Id":"_0addab42-618f-43dc-bf46-7232d0ee61e7"},"body":"{\"owner_id\":null,\"ewb_status\":\"GENERATED\",\"ewb_request\":{\"TransId\":\"19AAECS0761M1Z0\",\"TransName\":\"Test\",\"TransMode\":\"Air\",\"Distance\":10,\"TransDocNo\":\"123456\",\"TransDocDt\":\"11/07/2023\",\"VehNo\":null,\"VehType\":\"Regular\",\"DispDtls\":null,\"ExpShipDtls\":null,\"BuyerDtls\":{\"Gstin\":\"10AAECS0761M1ZI\",\"TrdNm\":\"Madhupur MFG\",\"Addr1\":\"Lalgarh, Madhupur\",\"Addr2\":\" \",\"Loc\":\"Deogarh\",\"Pin\":815353,\"Stcd\":\"20\"},\"SellerDtls\":{\"Gstin\":\"19AAECS0761M1Z0\",\"TrdNm\":\"Madhupur FB\",\"Addr1\":\"MOH : Pathal Chapti\",\"Addr2\":null,\"Loc\":\"Deogarh\",\"Pin\":815353,\"Stcd\":\"20\"},\"DocumentNumber\":\"3\",\"DocumentType\":\"Tax Invoice\",\"DocumentDate\":\"09/07/2023\",\"SupplyType\":\"1\",\"SubSupplyType\":\"1\",\"SubSupplyTypeDesc\":\"TEST\",\"TransactionType\":\"Regular\",\"ItemList\":[{\"ProdName\":\"Handmade Unfinished Biri - Assembly\",\"ProdDesc\":null,\"HsnCd\":\"24031921\",\"Qty\":80.000,\"Unit\":\"Pcs\",\"AssAmt\":40000.00,\"CgstRt\":0.00,\"CgstAmt\":null,\"SgstRt\":0.00,\"SgstAmt\":null,\"IgstRt\":0.00,\"IgstAmt\":null,\"CesRt\":0.00,\"CesAmt\":null,\"CesNonAdvAmt\":null,\"OthChrg\":null,\"OthChrgTcs\":null}],\"TotalInvoiceAmount\":40000.00,\"IsSupplyToOrSezUnit\":null,\"TotalCgstAmount\":0.00,\"TotalSgstAmount\":0.00,\"TotalIgstAmount\":0.00,\"TotalCessAmount\":null,\"TotalCessNonAdvolAmount\":null,\"TotalAssessableAmount\":null,\"OtherAmount\":null,\"OtherTcsAmount\":null},\"govt_response\":{\"Success\":\"Y\",\"Status\":\"GENERATED\",\"EwbNo\":871334512996,\"EwbDt\":\"2023-08-09 15:10:00\",\"EwbValidTill\":\"2023-08-10 23:59:00\"},\"transaction_id\":\"19AAECS0761M1Z0_3_INV_2023\"}"}

                        //var response = {"type":"http.ClientResponse","code":200,"headers":{"Content-Length":"1463","content-length":"1463","Content-Type":"application/json","content-type":"application/json","Date":"Tue, 11 Jul 2023 06:52:33 GMT","date":"Tue, 11 Jul 2023 06:52:33 GMT","Via":"1.1 mono001.prod-kix-ap4.core.ns.internal","via":"1.1 mono001.prod-kix-ap4.core.ns.internal","x-ratelimit-limit":"26","X-Ratelimit-Limit":"26","x-ratelimit-remaining":"25","X-Ratelimit-Remaining":"25","x-ratelimit-reset":"1","X-Ratelimit-Reset":"1","x-request-id":"_0addab42-618f-43dc-bf46-7232d0ee61e7","X-Request-Id":"_0addab42-618f-43dc-bf46-7232d0ee61e7"},"body":"{\"owner_id\":null,\"ewb_status\":\"GENERATED\",\"ewb_request\":{\"TransId\":\"19AAECS0761M1Z0\",\"TransName\":\"Test\",\"TransMode\":\"Air\",\"Distance\":10,\"TransDocNo\":\"123456\",\"TransDocDt\":\"11/07/2023\",\"VehNo\":null,\"VehType\":\"Regular\",\"DispDtls\":null,\"ExpShipDtls\":null,\"BuyerDtls\":{\"Gstin\":\"10AAECS0761M1ZI\",\"TrdNm\":\"Madhupur MFG\",\"Addr1\":\"Lalgarh, Madhupur\",\"Addr2\":\" \",\"Loc\":\"Deogarh\",\"Pin\":815353,\"Stcd\":\"20\"},\"SellerDtls\":{\"Gstin\":\"19AAECS0761M1Z0\",\"TrdNm\":\"Madhupur FB\",\"Addr1\":\"MOH : Pathal Chapti\",\"Addr2\":null,\"Loc\":\"Deogarh\",\"Pin\":815353,\"Stcd\":\"20\"},\"DocumentNumber\":\"3\",\"DocumentType\":\"Tax Invoice\",\"DocumentDate\":\"09/07/2023\",\"SupplyType\":\"1\",\"SubSupplyType\":\"1\",\"SubSupplyTypeDesc\":\"TEST\",\"TransactionType\":\"Regular\",\"ItemList\":[{\"ProdName\":\"Handmade Unfinished Biri - Assembly\",\"ProdDesc\":null,\"HsnCd\":\"24031921\",\"Qty\":80.000,\"Unit\":\"Pcs\",\"AssAmt\":40000.00,\"CgstRt\":0.00,\"CgstAmt\":null,\"SgstRt\":0.00,\"SgstAmt\":null,\"IgstRt\":0.00,\"IgstAmt\":null,\"CesRt\":0.00,\"CesAmt\":null,\"CesNonAdvAmt\":null,\"OthChrg\":null,\"OthChrgTcs\":null}],\"TotalInvoiceAmount\":40000.00,\"IsSupplyToOrSezUnit\":null,\"TotalCgstAmount\":0.00,\"TotalSgstAmount\":0.00,\"TotalIgstAmount\":0.00,\"TotalCessAmount\":null,\"TotalCessNonAdvolAmount\":null,\"TotalAssessableAmount\":null,\"OtherAmount\":null,\"OtherTcsAmount\":null},\"govt_response\":{\"Success\":\"Y\",\"Status\":\"GENERATED\",\"EwbNo\":891008771689,\"EwbDt\":\"2023-07-11 12:19:00\",\"EwbValidTill\":\"2023-07-12 23:59:00\"},\"transaction_id\":\"19AAECS0761M1Z0_3_INV_2023\"}"}
                        log.debug('GenerateEWayBill response : ', response);

                        if (response.body) {
                            var responsebody = JSON.parse(response.body).govt_response;
                            log.debug('GenerateEWayBill responsebody : ', responsebody);

                                if (responsebody.Success == 'Y') {
                                log.debug('responsebody.Success : ', responsebody.Success);
                                log.debug('responsebody.EwbNo ', responsebody.EwbNo);

                                var EwbDt = format.parse({
                                            value: new Date(responsebody.EwbDt),
                                            type: format.Type.DATETIMETZ
                                });
								 var EwbTill = format.parse({
                                            value: new Date(responsebody.EwbValidTill),
                                            type: format.Type.DATETIMETZ
                                });
                                
                               
                                
                                var id = record.submitFields({
                                    type: i_recType,
                                    id: i_recId,
                                    values: {
                                        custbody_in_eway_bill_no: Number(responsebody.EwbNo),
                                        custbody_in_eway_bill_date: EwbDt,
                                        custbody_in_eway_bill_valid_until_date: EwbTill,
                                        custbody_in_eway_export_status: 2
                                    },
                                    options: {
                                        enableSourcing: false,
                                        ignoreMandatoryFields: true
                                    }
                                });
                               
                                } 
                                else if (responsebody.Success == 'N') 
                                {
                                 var id = record.submitFields({
                                    type: i_recType,
                                    id: i_recId,
                                    values: {
                                        custbody_eway_billstatus_to: 1,
										 custbody_e_way_bill_error: responsebody.ErrorDetails[0].error_message
                                    },
                                    options: {
                                        enableSourcing: false,
                                        ignoreMandatoryFields: true
                                    }
                                });
                              
                                }
                            
                            
                            
                        }
                    }
              
            } catch (error) {
              log.error("Error in request:",error)
            }
			
		

		return response;
	}

	function GetPartARequestBody(objRec,i_recId)
	{
		try
		{
		var BuyerGSTIN =  objRec.getValue({fieldId:'location'});
        var SellerGSTIN =  objRec.getValue({fieldId:'custbody_from_location_gstin'});
		var fromlocation = objRec.getValue({fieldId:'location'});
		var tolocation = objRec.getValue({fieldId:'location'});
		var subsidiary = objRec.getValue({fieldId : 'subsidiary'});
		var BuyerDtls = GetBuyersDetails(objRec,BuyerGSTIN,tolocation)
		var SellerDtls = GetSellerDetails(subsidiary)

    	var LineCount = objRec.getLineCount({sublistId: 'item'});
    	var ItemList = [];
		 // var taxtotal25 = objRec.getValue({fieldId: 'taxtotal2'});
			 // if(taxtotal25 != undefined){
				// taxtotal25 = taxtotal25; 
			 // }else{
				// taxtotal25 = 0; 
			 // }
		
			 // var taxtotal26 = objRec.getValue({fieldId: 'taxtotal3'});
			  // if(taxtotal26 != undefined){
				// taxtotal26 = taxtotal26; 
			 // }else{
				// taxtotal26 = 0; 
			 // }
			 
			
			 // var taxtotal27 = objRec.getValue({fieldId: 'taxtotal4'});
			  // if(taxtotal27 != undefined){
				// taxtotal27 = taxtotal27; 
			 // }else{
				// taxtotal27 = 0; 
			 // }
    	for(var j=0;j<LineCount;j++)
    	{
			
			var itemLine = objRec.getSublistValue({sublistId: 'item',fieldId: 'line',line: j});
			log.debug('itemLine',itemLine);
			var taxType;
			var taxRate= 0;
			var taxAmt = 0;
			var itemAmount = 0;
			var invoiceSearchObj = search.create({
   type: "invoice",
   settings:[{"name":"consolidationtype","value":"ACCTTYPE"},{"name":"includeperiodendtransactions","value":"F"}],
   filters:
   [
      ["type","anyof","CustInvc"], 
      "AND", 
      ["internalid","anyof",i_recId], 
      "AND", 
      ["line","equalto",itemLine], 
      "AND", 
      ["taxdetail.taxtype","anyof","2","3"]
   ],
   columns:
   [
    
      search.createColumn({
         name: "taxamount",
         join: "taxDetail",
         label: "Tax Amount"
      }),
      
      search.createColumn({
         name: "taxcode",
         join: "taxDetail",
         label: "Tax Code"
      }),
 search.createColumn({
         name: "taxrate",
         join: "taxDetail",
         label: "Tax Rate"
      }),
      search.createColumn({
         name: "taxtype",
         join: "taxDetail",
         label: "Tax Type"
      }),
	    search.createColumn({
         name: "taxbasis",
         join: "taxDetail",
         label: "Tax Basis (Foreign Currency)"
       })
   ]
});
var searchResultCount = invoiceSearchObj.runPaged().count;
log.debug("invoiceSearchObj result count",searchResultCount);
invoiceSearchObj.run().each(function(result){
 taxAmt = result.getValue({
	 name: "taxamount",
         join: "taxDetail"
 });
  taxType = result.getValue({
	 name: "taxtype",
         join: "taxDetail"
 });
  taxRate = result.getValue({
	 name: "taxrate",
       join: "taxDetail",
  });
  itemAmount = result.getValue({
	 name: "taxbasis",
       join: "taxDetail",
  });
  
  
  log.debug('taxRate',taxRate);
   return true;
});
log.debug('taxType',taxType);
var igstAmt = 0;
var igstRate = 0;
var csgtAmt = 0;
var csgtRate = 0;
var sgstAmt = 0;
var sgstRate = 0;
var igstTaxTotal = 0;
var sgstTaxTotal = 0;
var cgstTaxTotal = 0;

if(taxType == 3){
	csgtAmt= Number(taxAmt)
	sgstAmt = Number(taxAmt)
	csgtRate =  parseFloat(taxRate.replace('%', '')); 
	sgstRate =  parseFloat(taxRate.replace('%', '')); 
	sgstTaxTotal = Number(sgstTaxTotal) + Number(taxAmt)
	cgstTaxTotal = Number(cgstTaxTotal) + Number(taxAmt)
}
else {
	igstAmt = Number(taxAmt)
	igstRate = Math.floor(taxRate) 
	igstTaxTotal = Number(igstTaxTotal) + Number(taxAmt)
}


    		ItemList.push({
                "ProdName": objRec.getSublistText({sublistId: 'item',fieldId: 'item',line: j}),
                "HsnCd": objRec.getSublistText({sublistId: 'item',fieldId: 'custcol_in_hsn_code',line: j}),
                "Qty":  objRec.getSublistValue({sublistId: 'item',fieldId: 'quantity',line: j}),
                "Unit":  objRec.getSublistText({sublistId: 'item',fieldId: 'units',line: j}),
                "AssAmt":   itemAmount,
				//Number(objRec.getValue({fieldId:'total'})),
				//objRec.getSublistValue({sublistId: 'item',fieldId: 'amount',line: j}),
               "IgstRt": igstRate,
                "CgstRt": csgtRate,
                "SgstRt": sgstRate,
				 "CgstAmt": csgtAmt,
				  "SgstAmt": sgstAmt,
				  "IgstAmt": igstAmt,
                "CesRt": 0,
            })
    	}
        var DocumentDate = format.format({
                 type: format.Type.DATE,
                value: objRec.getValue({fieldId:'trandate'})
            });
        var TransDate = format.format({
                 type: format.Type.DATE,
                value: objRec.getValue({fieldId:'custbody_in_eway_transport_date'})
            });
		var requestHeaderbody = {
            "DocumentNumber": objRec.getValue({fieldId:'tranid'}),
            "DocumentType":  'INV',
            "DocumentDate":  DocumentDate,
            "SupplyType": 'OUTWARD',
            "SubSupplyType": 'SUPPLY',
            "SubSupplyTypeDesc": "TEST",
            "TransactionType": objRec.getText({fieldId:'custbody_in_eway_transaction_type'}),
            "BuyerDtls":BuyerDtls,
            "SellerDtls":SellerDtls ,
            "ItemList": ItemList,
            "TotalInvoiceAmount":  Number(objRec.getValue({fieldId:'total'})),
            "TotalCgstAmount": cgstTaxTotal,
            "TotalSgstAmount": sgstTaxTotal,
            "TotalIgstAmount": igstTaxTotal,
            "TransId": objRec.getValue({fieldId:'custbody_in_eway_transport_id'}),
            "TransName": objRec.getValue({fieldId:'custbody_in_eway_transport_name'}),
            "TransMode": objRec.getText({fieldId:'custbody_in_eway_transport_mode'}),
            "Distance": objRec.getValue({fieldId:'custbody_in_eway_transport_dist'}),
            "TransDocNo": objRec.getValue({fieldId:'custbody_in_eway_transp_doc_no'}),
            "TransDocDt": TransDate,
            "VehNo": objRec.getValue({fieldId:'custbody_in_eway_vehicle_no'}),
            "VehType": objRec.getText({fieldId:'custbody_in_eway_vehicle_type'}),
			"OtherAmount" : 0
			//objRec.getValue({fieldId:'discounttotal'})
        }
       

		}
		catch(err)
		{
			log.error("Error in GetPartARequestBody:",err)
		}

		return JSON.stringify(requestHeaderbody);
	}

	function GetBuyersDetails(objRec,GSTIN,locationid) {
		var BuyerDtls;
		var locationSearchObj = search.create({
   		type: "location",
   		filters:
   		[
   			["internalid","anyof",locationid]
   		],
   		columns:
   		[
      		search.createColumn({name: "name",sort: search.Sort.ASC,label: "Name"}),
      		search.createColumn({name: "phone", label: "Phone"}),
      		search.createColumn({name: "city", label: "City"}),
      		search.createColumn({name: "state", label: "State/Province"}),
      		search.createColumn({name: "country", label: "Country"}),
      		search.createColumn({name: "address1", label: "Address 1"}),
      		search.createColumn({name: "address2", label: "Address 2"}),
      		search.createColumn({name: "zip", label: "Zip"})
   		]
	  });
	    var searchResultCount = locationSearchObj.runPaged().count;
      var results = locationSearchObj.run().getRange({start : 0, end   : 1000})
	    var state = results[0].getValue({name: "state", label: "State/Province"});
	    if(state)
	    {
	    	var tempstate = state.split("-");
	    	state = tempstate[0];
	    }
		  BuyerDtls = {
			"Gstin": "URP",
        	"LglNm": results[0].getValue({name: "name",sort: search.Sort.ASC,label: "Name"}),
        	"TrdNm": results[0].getValue({name: "name",sort: search.Sort.ASC,label: "Name"}),
        	"Addr1": results[0].getValue({name: "address1", label: "Address 1"}),
        	"Loc":   results[0].getValue({name: "city", label: "City"}),
        	"Pin":   results[0].getValue({name: "zip", label: "Zip"}),
        	"Stcd":  state
		}
		return BuyerDtls;
	}
	function GetSellerDetails(subsidiary) 
	{
		var sellerDetails;
		 
		 var subsidiarySearchObj = search.create({
   type: "subsidiary",
   filters:
   [
      ["internalid","anyof",subsidiary]
   ],
   columns:
   [
      search.createColumn({name: "name", label: "Name"}),
      search.createColumn({name: "city", label: "City"}),
      search.createColumn({name: "state", label: "State/Province"}),
      search.createColumn({name: "country", label: "Country"}),
      search.createColumn({name: "taxregistrationnumber", label: "Tax Reg. Number"}),
      search.createColumn({name: "legalname", label: "Legal Name"}),
      search.createColumn({name: "address1", label: "Address 1"}),
      search.createColumn({name: "address2", label: "Address 2"}),
      search.createColumn({name: "zip", label: "Zip"})
   ]
});
var searchResultCount = subsidiarySearchObj.runPaged().count;
log.debug("subsidiarySearchObj result count",searchResultCount);
 var results = subsidiarySearchObj.run().getRange({start : 0, end   : 1000})
	    var state = results[0].getValue({name: "state", label: "State/Province"});
	    if(state)
	    {
	    	var tempstate = state.split("-");
	    	state = tempstate[0];
	    }
		  sellerDetails = {
			"Gstin": results[0].getValue({name: "taxregistrationnumber",label: "Name"}),
        	"LglNm": results[0].getValue({name: "name",label: "Name"}),
        	"TrdNm": results[0].getValue({name: "name",label: "Name"}),
        	"Addr1": results[0].getValue({name: "address1", label: "Address 1"}),
        	"Loc":   results[0].getValue({name: "city", label: "City"}),
        	"Pin":   results[0].getValue({name: "zip", label: "Zip"}),
        	"Stcd":  state
		}
	return sellerDetails;
	}
	return {
		onRequest : onRequest
	};
});