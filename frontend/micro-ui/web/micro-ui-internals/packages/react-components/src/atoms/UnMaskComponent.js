import PropTypes from "prop-types";
import React from "react";
import { PrivacyMaskIcon } from "..";

/**
 * Custom Component to demask the masked values.
 *
 * @author jagankumar-egov
 *
 * Feature :: Privacy
 *
 * @example
 * <UnMaskComponent   privacy={{ uuid: "", fieldName: "name", model: "User" ,hide: false}}   />
 */

const UnMaskComponent = React.memo(({ privacy = {} }) => {
  const { isLoading, data } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "DataSecurity",
    [{ name: "SecurityPolicy", filter: `[?(@.model == '${privacy?.model}')]` }],
    {
      select: (data) => data?.DataSecurity?.SecurityPolicy?.[0] || {},
    }
  );
  const { privacy: privacyValue, updatePrivacy } = Digit.Hooks.usePrivacyContext();
  if (isLoading || privacy?.hide) {
    return null;
  }

  if (Digit.Utils.checkPrivacy(data, privacy)) {
    return (
      <span
        onClick={() => {
          updatePrivacy(privacy?.uuid, privacy?.fieldName);
        }}
      >
        <PrivacyMaskIcon className="privacy-icon"></PrivacyMaskIcon>
      </span>
    );
  }
  return null;
});

UnMaskComponent.propTypes = {
  privacy: PropTypes.object,
};

UnMaskComponent.defaultProps = {
  privacy: { uuid: "", fieldName: "", model: "" },
};

export default UnMaskComponent;
