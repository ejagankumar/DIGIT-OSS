package org.egov.echallan.repository;

import static org.egov.echallan.repository.builder.ChallanQueryBuilder.CANCEL_RECEIPT_UPDATE_SQL;
import static org.egov.echallan.repository.builder.ChallanQueryBuilder.FILESTOREID_UPDATE_SQL;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.egov.common.contract.request.RequestInfo;
import org.egov.echallan.config.ChallanConfiguration;
import org.egov.echallan.model.Challan;
import org.egov.echallan.model.ChallanRequest;
import org.egov.echallan.model.SearchCriteria;
import org.egov.echallan.producer.Producer;
import org.egov.echallan.repository.builder.ChallanQueryBuilder;
import org.egov.echallan.repository.rowmapper.ChallanCountRowMapper;
import org.egov.echallan.repository.rowmapper.ChallanRowMapper;
import org.egov.echallan.web.models.collection.Bill;
import org.egov.echallan.web.models.collection.PaymentDetail;
import org.egov.echallan.web.models.collection.PaymentRequest;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SingleColumnRowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;


@Slf4j
@Repository
public class ChallanRepository {

    private Producer producer;
    
    private ChallanConfiguration config;

    private JdbcTemplate jdbcTemplate;

    private ChallanQueryBuilder queryBuilder;

    private ChallanRowMapper rowMapper;
    
    private RestTemplate restTemplate;

    @Value("${egov.filestore.host}")
    private String fileStoreHost;

    @Value("${egov.filestore.setinactivepath}")
	private String fileStoreInactivePath;

    @Autowired
	private ObjectMapper mapper;

    @Autowired
    private ChallanCountRowMapper countRowMapper;

    @Autowired
    public ChallanRepository(Producer producer, ChallanConfiguration config,ChallanQueryBuilder queryBuilder,
    		JdbcTemplate jdbcTemplate,ChallanRowMapper rowMapper,RestTemplate restTemplate) {
        this.producer = producer;
        this.config = config;
        this.jdbcTemplate = jdbcTemplate;
        this.queryBuilder = queryBuilder ; 
        this.rowMapper = rowMapper;
        this.restTemplate = restTemplate;
    }



    /**
     * Pushes the request on save topic
     *
     * @param ChallanRequest The challan create request
     */
    public void save(ChallanRequest challanRequest) {
    	
        producer.push(config.getSaveChallanTopic(), challanRequest);
    }
    
    /**
     * Pushes the request on update topic
     *
     * @param ChallanRequest The challan create request
     */
    public void update(ChallanRequest challanRequest) {
    	
        producer.push(config.getUpdateChallanTopic(), challanRequest);
    }
    
    
    public List<Challan> getChallans(SearchCriteria criteria) {
        List<Object> preparedStmtList = new ArrayList<>();
        String query = queryBuilder.getChallanSearchQuery(criteria, preparedStmtList);
        List<Challan> challans =  jdbcTemplate.query(query, preparedStmtList.toArray(), rowMapper);
        return challans;
    }



	public void updateFileStoreId(List<Challan> challans) {
		List<Object[]> rows = new ArrayList<>();

        challans.forEach(challan -> {
        	rows.add(new Object[] {challan.getFilestoreid(),
        			challan.getId()}
        	        );
        });

        jdbcTemplate.batchUpdate(FILESTOREID_UPDATE_SQL,rows);
		
	}
	
	 public void setInactiveFileStoreId(String tenantId, List<String> fileStoreIds)  {
			String idLIst = fileStoreIds.toString().substring(1, fileStoreIds.toString().length() - 1).replace(", ", ",");
			String Url = fileStoreHost + fileStoreInactivePath + "?tenantId=" + tenantId + "&fileStoreIds=" + idLIst;
			try {
				  restTemplate.postForObject(Url, null, String.class) ;
			} catch (Exception e) {
				log.error("Error in calling fileStore "+e.getMessage());
			}
			 
		}

	public void updateChallanOnCancelReceipt(HashMap<String, Object> record) {
		// TODO Auto-generated method stub

		PaymentRequest paymentRequest = mapper.convertValue(record, PaymentRequest.class);
		RequestInfo requestInfo = paymentRequest.getRequestInfo();

		List<PaymentDetail> paymentDetails = paymentRequest.getPayment().getPaymentDetails();
		String tenantId = paymentRequest.getPayment().getTenantId();
		List<Object[]> rows = new ArrayList<>();
		for (PaymentDetail paymentDetail : paymentDetails) {
			Bill bill = paymentDetail.getBill();
			rows.add(new Object[] {bill.getConsumerCode(),
        			bill.getBusinessService()}
        	        );
		}
		jdbcTemplate.batchUpdate(CANCEL_RECEIPT_UPDATE_SQL,rows);
		
	}

    /**
     * DB Repository that makes jdbc calls to the db and fetches challan count.
     *
     * @param tenantId
     * @return
     */
    public Map<String,String> fetchChallanCount(String tenantId){
        Map<String,String> response = new HashMap<>();
        List<Object> preparedStmtList = new ArrayList<>();

        String query = queryBuilder.getChallanCountQuery(tenantId, preparedStmtList);
        
        try {
            response=jdbcTemplate.query(query, preparedStmtList.toArray(),countRowMapper);
        }catch(Exception e) {
            log.error("Exception while making the db call: ",e);
            log.error("query; "+query);
        }
        return response;
    }

	public List<String> fetchChallanIds(SearchCriteria criteria) {
		List<Object> preparedStmtList = new ArrayList<>();
		preparedStmtList.add(criteria.getOffset());
		preparedStmtList.add(criteria.getLimit());

		List<String> ids = jdbcTemplate.query("SELECT id from eg_echallan ORDER BY createdtime offset " +
						" ? " +
						"limit ? ",
				preparedStmtList.toArray(),
				new SingleColumnRowMapper<>(String.class));
		return ids;
	}
	public List<Challan> getChallanPlainSearch (SearchCriteria criteria) {

		if(criteria.getIds() == null || criteria.getIds().isEmpty())
			throw new CustomException("PLAIN_SEARCH_ERROR", "Search only allowed by ids!");

		List<Object> preparedStmtList = new ArrayList<>();
		String query = queryBuilder.getChallanLikeQuery(criteria, preparedStmtList);
		log.info("Query: "+query);
		log.info("PS: "+preparedStmtList);
		return jdbcTemplate.query(query, preparedStmtList.toArray(), rowMapper);
	}
	

}
