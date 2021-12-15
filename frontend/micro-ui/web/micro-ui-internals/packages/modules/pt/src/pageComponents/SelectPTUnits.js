import { CardLabel, Dropdown, FormStep, LinkButton, TextInput } from "@egovernments/digit-ui-react-components";
import React, {Fragment, useState } from "react";

const getUnique = (arr) => {
  return arr.filter((value, index, self) => self.indexOf(value) === index);
};
const getUsageCategory = (usageCategory) => {
  let categoryArray = usageCategory.split(".");
  let tempObj = {};
  tempObj["usageCategoryMajor"] = categoryArray && categoryArray.length > 0 && categoryArray[0];
  tempObj["usageCategoryMinor"] = categoryArray && categoryArray.length > 1 && categoryArray[1];
  tempObj["usageCategorySubMinor"] = categoryArray && categoryArray.length > 2 && categoryArray[2];
  tempObj["usageCategoryDetail"] = categoryArray && categoryArray.length > 3 && categoryArray[3];
  return tempObj;
};

const DeleteIcon = (showIcon = false) => {
  return (
    <div>
      <span>
        <svg
          style={{ float: "right", position: "relative", bottom: "32px" }}
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1 16C1 17.1 1.9 18 3 18H11C12.1 18 13 17.1 13 16V4H1V16ZM14 1H10.5L9.5 0H4.5L3.5 1H0V3H14V1Z"
            fill={!showIcon ? "#494848" : "#FAFAFA"}
          />
        </svg>
      </span>
    </div>
  );
};

const formatUnits = (units) => {
  return units.map((unit) => {
    let usageCategory = unit.usageCategory.includes("RESIDENTIAL") ? "RESIDENTIAL" : getUsageCategory(unit.usageCategory).usageCategoryMinor;
    return {
      ...unit,
      builtUpArea: unit?.constructionDetail?.builtUpArea,
      usageCategory: { code: usageCategory, i18nKey: `PROPERTYTAX_BILLING_SLAB_${usageCategory}` },
      occupancyType: { code: unit.occupancyType, i18nKey: `PROPERTYTAX_OCCUPANCYTYPE_${unit.occupancyType}` },
      floorNo: { code: unit.floorNo, i18nKey: `PROPERTYTAX_FLOOR_${unit.floorNo}` },
      unitType: { code: unit.unitType, i18nKey: `PROPERTYTAX_BILLING_SLAB_${unit.unitType}` },
    };
  });
};
const SelectPTUnits = ({ t, config, onSelect, userType, formData }) => {
  const [fields, setFields] = useState(
    (formData?.units?.length > 0 && formatUnits(formData?.units)) || [
      { usageCategory: "", unitType: "", occupancyType: "", builtUpArea: null, arv: "", floorNo: "" },
    ]
  );

  const { data: mdmsData } = Digit.Hooks.useCommonMDMS(Digit.ULBService.getStateId(), "PropertyTax", ["Floor", "OccupancyType", "UsageCategory"], {
    select: (data) => {
      let usageCategory = data?.PropertyTax?.UsageCategory?.map((category) => getUsageCategory(category.code))
        .filter(
          (category) => category.usageCategoryDetail === false && category.usageCategorySubMinor === false && category.usageCategoryMinor !== false
        )
        .map((category) => ({ code: category.usageCategoryMinor, i18nKey: `PROPERTYTAX_BILLING_SLAB_${category.usageCategoryMinor}` }));
      let subCategory = getUnique(
        data?.PropertyTax?.UsageCategory.map((e) => getUsageCategory(e.code))
          .filter((e) => e.usageCategoryDetail)
          .map((e) => ({
            code: e.usageCategoryDetail,
            i18nKey: `PROPERTYTAX_BILLING_SLAB_${e.usageCategoryDetail}`,
            usageCategorySubMinor: e.usageCategorySubMinor,
            usageCategoryMinor: e.usageCategoryMinor,
          }))
      );

      return {
        Floor: data?.PropertyTax?.Floor?.filter((floor) => floor.active)?.map((floor) => ({
          i18nKey: `PROPERTYTAX_FLOOR_${floor.code}`,
          code: floor.code,
        })),
        OccupancyType: data?.PropertyTax?.OccupancyType?.filter((occupancy) => occupancy.active)?.map((occupancy) => ({
          i18nKey: `PROPERTYTAX_OCCUPANCYTYPE_${occupancy.code}`,
          code: occupancy.code,
        })),
        UsageCategory: usageCategory,
        UsageSubCategory: subCategory,
        usageDetails: data?.PropertyTax?.UsageCategory,
      };
    },
    retry: false,
    enable: false,
  });

  console.log(mdmsData, "UpdateNumberConfigUpdateNumberConfigUpdateNumberConfig");
  function handleAdd() {
    const values = [...fields];
    values.push({ usageCategory: "", unitType: "", occupancyType: "", builtUpArea: null, arv: "", floorNo: "" });
    setFields(values);
  }

  function handleRemove(index) {
    const values = [...fields];
    if (values.length != 1) {
      values.splice(index, 1);
      setFields(values);
    }
  }

  function selectSubUsageCategory(i, value) {
    let units = [...fields];
    units[i].unitType = value;

    setFields(units);
  }

  function selectUsageCategory(i, value) {
    let units = [...fields];
    units[i].usageCategory = value;

    setFields(units);
  }
  function selectFloor(i, value) {
    let units = [...fields];
    units[i].floorNo = value;

    setFields(units);
  }
  function selectOccupancy(i, value) {
    let units = [...fields];
    units[i].occupancyType = value;

    setFields(units);
  }
  function onChangeRent(i, e) {
    let units = [...fields];
    units[i].arv = e.target.value;
    setFields(units);
  }
  function onChangeArea(i, e) {
    let units = [...fields];
    units[i].builtUpArea = e.target.value;
    setFields(units);
  }

  const goNext = () => {
    let units = formData.units;
    let unitsdata;

    unitsdata = fields.map((field) => {
      let unit = {};
      Object.keys(field).filter(key=>field[key]).map((key) => {
        if (key === "usageCategory") {
          unit["usageCategory"] = mdmsData?.usageDetails.find(
            (e) =>
              e.code.includes(field[key]?.code) && e.code.includes(typeof field["unitType"] == "object" ? field["unitType"]?.code : field["unitType"])
          )?.code;
        } else if (key === "builtUpArea") {
          unit["constructionDetail"] = { builtUpArea: field[key] };
        } else {
          unit[key] = typeof field[key] == "object" ? field[key]?.code : field[key];
        }
      });
      return unit;
    });

    console.log(units, unitsdata, "units");
    onSelect(config.key, unitsdata);
  };

  const onSkip = () => onSelect();

  return (
    <FormStep
      config={config}
      onSelect={goNext}
      onSkip={onSkip}
      t={t}
      // isDisabled={!fields[0].tradecategory || !fields[0].tradetype || !fields[0].tradesubtype}
    >
      {fields.map((field, index) => {
        return (
          <div key={`${field}-${index}`}>
            <div
              style={{
                border: "solid",
                borderRadius: "5px",
                padding: "10px",
                paddingTop: "20px",
                marginTop: "10px",
                borderColor: "#f3f3f3",
                background: "#FAFAFA",
              }}
            >
              <LinkButton
                label={<DeleteIcon showIcon={fields.length === 1} />}
                style={{ width: "100px", display: "inline" }}
                onClick={(e) => handleRemove(index)}
              />
              <CardLabel>{`${t("PT_FORM2_USAGE_TYPE")}`}</CardLabel>
              <Dropdown
                t={t}
                optionKey="i18nKey"
                isMandatory={config.isMandatory}
                option={[
                  ...(mdmsData?.UsageCategory ? mdmsData?.UsageCategory : []),
                  { code: "RESIDENTIAL", i18nKey: "PROPERTYTAX_BILLING_SLAB_RESIDENTIAL" },
                ]}
                selected={field?.usageCategory}
                select={(e) => selectUsageCategory(index, e)}
              />
              {field?.usageCategory?.code&&field.usageCategory.code.includes("RESIDENTIAL")===false&&(<><CardLabel>{`${t("PT_FORM2_SUB_USAGE_TYPE")}`}</CardLabel>
              <div className={"form-pt-dropdown-only"}>
                <Dropdown
                  t={t}
                  optionKey="i18nKey"
                  isMandatory={config.isMandatory}
                  option={mdmsData?.UsageSubCategory}
                  selected={field?.unitType}
                  select={(e) => selectSubUsageCategory(index, e)}
                />
              </div></>)}
              <CardLabel>{`${t("PT_FORM2_OCCUPANCY")}`}</CardLabel>
              <div className={"form-pt-dropdown-only"}>
                <Dropdown
                  t={t}
                  optionKey="i18nKey"
                  isMandatory={config.isMandatory}
                  option={mdmsData?.OccupancyType}
                  selected={field?.occupancyType}
                  select={(e) => selectOccupancy(index, e)}
                />
              </div>
              {field?.occupancyType?.code&&field.occupancyType.code.includes("RENTED")&&(<><CardLabel>{`${t("PT_FORM2_TOTAL_ANNUAL_RENT")}`}</CardLabel>
              <TextInput
                style={{ background: "#FAFAFA" }}
                t={t}
                type={"text"}
                isMandatory={false}
                optionKey="i18nKey"
                name="arv"
                value={field?.arv}
                onChange={(e) => onChangeRent(index, e)}
                {...{
                  isRequired: true,
                  pattern: "[0-9]+",
                  type: "text",
                  title: t("CORE_COMMON_REQUIRED_ERRMSG"),
                }}
              />
              </>)}
              <CardLabel>{`${t("PT_FORM2_BUILT_UP_AREA")}`}</CardLabel>
              <TextInput
                style={{ background: "#FAFAFA" }}
                t={t}
                type={"text"}
                isMandatory={false}
                optionKey="i18nKey"
                name="builtUpArea"
                value={field?.builtUpArea}
                onChange={(e) => onChangeArea(index, e)}
                {...{
                  isRequired: true,
                  pattern: "[0-9]+",
                  type: "text",
                  title: t("CORE_COMMON_REQUIRED_ERRMSG"),
                }}
              />
              <CardLabel>{`${t("PT_FORM2_SELECT_FLOOR")}`}</CardLabel>
              <div className={"form-pt-dropdown-only"}>
                <Dropdown
                  t={t}
                  optionKey="i18nKey"
                  isMandatory={config.isMandatory}
                  option={mdmsData?.Floor}
                  selected={field?.floorNo}
                  select={(e) => selectFloor(index, e)}
                />
              </div>
            </div>
          </div>
        );
      })}
      <div style={{ justifyContent: "center", display: "flex", paddingBottom: "15px", color: "#FF8C00" }}>
        <button type="button" style={{ paddingTop: "10px" }} onClick={() => handleAdd()}>
          {`${t("PT_ADD_UNIT")}`}
        </button>
      </div>
    </FormStep>
  );
};
export default SelectPTUnits;
