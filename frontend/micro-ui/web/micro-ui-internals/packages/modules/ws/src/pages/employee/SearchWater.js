import { Loader, Toast } from "@egovernments/digit-ui-react-components";
import React, { useState, Fragment, useCallback } from "react";
import { useTranslation } from "react-i18next";

const SearchWater = ({ path }) => {
  const [isBothCallsFinished, setIsBothCallFinished] = useState(true);
  const { t } = useTranslation();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [payload, setPayload] = useState({});
  const [setLoading, setLoadingState] = useState(false);
  const SWater = Digit.ComponentRegistryService.getComponent("WSSearchWaterConnection");
  // const [businessServ, setBusinessServ] = useState([]);
  const getUrlPathName = window.location.pathname;
  const checkPathName = getUrlPathName.includes("water/search-connection");
  const businessServ = checkPathName ? "WS" : "SW";

  const [showToast, setShowToast] = useState(null);
  const serviceConfig = {
    WATER: "WATER",
    SEWERAGE: "SEWERAGE",
  };

  const onSubmit = useCallback((_data) => {
    const { connectionNumber, oldConnectionNumber, mobileNumber, propertyId } = _data;
    if (!connectionNumber && !oldConnectionNumber && !mobileNumber && !propertyId) {
      setShowToast({ error: true, label: "WS_HOME_SEARCH_CONN_RESULTS_DESC" });
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } else {
      setPayload(
        Object.keys(_data)
          .filter((k) => _data[k])
          .reduce((acc, key) => ({ ...acc, [key]: typeof _data[key] === "object" ? _data[key].code : _data[key] }), {})
      );
    }
  });

  const config = {
    enabled: !!(payload && Object.keys(payload).length > 0),
  };

  let result = Digit.Hooks.ws.useSearchWS({ tenantId, filters: payload, config, bussinessService: businessServ, t });

  result = result?.map((item) => {
    if (item?.connectionNo?.includes("WS")) {
      item.service = serviceConfig.WATER;
    } else if (item?.connectionNo?.includes("SW")) {
      item.service = serviceConfig.SEWERAGE;
    }
    return item;
  });

  return (
    <Fragment>
      <SWater
        t={t}
        tenantId={tenantId}
        onSubmit={onSubmit}
        data={result ? result : { display: "ES_COMMON_NO_DATA" }}
        count={result?.TotalCount}
        resultOk={isBothCallsFinished}
        businessService={businessServ}
      />

      {showToast && (
        <Toast
          error={showToast.error}
          warning={showToast.warning}
          label={t(showToast.label)}
          onClose={() => {
            setShowToast(null);
          }}
        />
      )}
    </Fragment>
  );
};

export default SearchWater;
