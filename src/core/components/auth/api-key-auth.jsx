import React from "react"
import PropTypes from "prop-types"

export default class ApiKeyAuth extends React.Component {
  static propTypes = {
    authorized: PropTypes.object,
    getComponent: PropTypes.func.isRequired,
    errSelectors: PropTypes.object.isRequired,
    schema: PropTypes.object.isRequired,
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func
  }

  constructor(props, context) {
    super(props, context)
    let { name, schema } = this.props
    let value = this.getValue()

    this.state = {
      name: name,
      schema: schema,
      value: value
    }
  }

  getValue () {
    let { name, authorized } = this.props

    return authorized && authorized.getIn([name, "value"])
  }

  onChange =(e) => {
    let { onChange } = this.props
    let value = e.target.value
    let newState = Object.assign({}, this.state, { value: value })

    this.setState(newState)
    onChange(newState)
  }

  render() {
    let { schema, getComponent, errSelectors, name } = this.props
    const Input = getComponent("Input")
    const Row = getComponent("Row")
    const Col = getComponent("Col")
    const AuthError = getComponent("authError")
    const Markdown = getComponent( "Markdown" )
    const JumpToPath = getComponent("JumpToPath", true)
    let value = this.getValue()
    let errors = errSelectors.allErrors().filter( err => err.get("authId") === name)

    return (
      <div>
        <h4>
          <code>{ name || schema.get("name") }</code>&nbsp;
          (apiKey)
          <JumpToPath path={[ "securityDefinitions", name ]} />
        </h4>
        { value && <h5>Авторизованный</h5>}
        <Row>
          <Markdown source={ schema.get("description") } />
        </Row>
        <Row>
          <p>Название: <code>{ schema.get("name") }</code></p>
        </Row>
        <Row>
          <p>Местоположение: <code>{ schema.get("in") }</code></p>
        </Row>
        <Row>
          <label>Значение:</label>
          {
            value ? <code> ****** </code>
                  : <Col><Input type="text" onChange={ this.onChange }/></Col>
          }
        </Row>
        {
          errors.valueSeq().map( (error, key) => {
            return <AuthError error={ error }
                              key={ key }/>
          } )
        }
      </div>
    )
  }
}
