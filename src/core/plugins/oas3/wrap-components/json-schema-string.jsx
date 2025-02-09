import React from "react"
import { OAS3ComponentWrapFactory } from "../helpers"

export default OAS3ComponentWrapFactory(({ Ori, ...props }) => {
  const {
    schema,
    getComponent,
    errors,
    onChange,
    index
  } = props

  const { type, format } = schema
  const Input = getComponent("Input")
  if(type === "string" && (format === "binary" || format === "base64")) {
    return <Input type="file"
                  index={index}
                  inputValue={props.value}
                   className={`inputfile inputfile-6 ${errors.length ? "invalid" : ""}`}
                   title={ errors.length ? errors : ""}
                   onChange={(e) => {
                     onChange(e.target.files[0])
                   }}
                   disabled={Ori.isDisabled}/>
  } else {
    return <Ori {...props} />
  }
})
