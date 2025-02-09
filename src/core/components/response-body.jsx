import React from "react"
import PropTypes from "prop-types"
import formatXml from "xml-but-prettier"
import toLower from "lodash/toLower"
import { extractFileNameFromContentDispositionHeader } from "core/utils"
import win from "core/window"

export default class ResponseBody extends React.PureComponent {
  state = {
    parsedContent: null
  }

  static propTypes = {
    content: PropTypes.any.isRequired,
    contentType: PropTypes.string,
    getComponent: PropTypes.func.isRequired,
    headers: PropTypes.object,
    url: PropTypes.string
  }

  updateParsedContent = (prevContent) => {
    const { content } = this.props
    console.log(content)
    if(prevContent === content) {
      return
    }

    if(content && content instanceof Blob) {
      var reader = new FileReader()
      reader.onload = () => {
        this.setState({
          parsedContent: reader.result
        })
      }
      reader.readAsText(content)
    } else {
      this.setState({
        parsedContent: content.toString()
      })
    }
  }

  componentDidMount() {
    this.updateParsedContent(null)
  }

  componentDidUpdate(prevProps) {
    this.updateParsedContent(prevProps.content)
  }

  render() {
    let { content, contentType, url, headers={}, getComponent } = this.props
    const { parsedContent } = this.state
    const HighlightCode = getComponent("highlightCode")
    const downloadName = "response_" + new Date().getTime()
    let body, bodyEl
    url = url || ""

    if (
      /^application\/octet-stream/i.test(contentType) ||
      (headers["Content-Disposition"] && (/attachment/i).test(headers["Content-Disposition"])) ||
      (headers["content-disposition"] && (/attachment/i).test(headers["content-disposition"])) ||
      (headers["Content-Description"] && (/File Transfer/i).test(headers["Content-Description"])) ||
      (headers["content-description"] && (/File Transfer/i).test(headers["content-description"]))) {
      // Download

      if ("Blob" in window) {
        let type = contentType || "text/html"
        let blob = (content instanceof Blob) ? content : new Blob([content], {type: type})
        let href = window.URL.createObjectURL(blob)
        let fileName = url.substr(url.lastIndexOf("/") + 1)
        let download = [type, fileName, href].join(":")

        // Use filename from response header,
        // First check if filename is quoted (e.g. contains space), if no, fallback to not quoted check
        let disposition = headers["content-disposition"] || headers["Content-Disposition"]
        if (typeof disposition !== "undefined") {
          let responseFilename = extractFileNameFromContentDispositionHeader(disposition)
          if (responseFilename !== null) {
            download = responseFilename
          }
        }

        if(win.navigator && win.navigator.msSaveOrOpenBlob) {
            bodyEl = <div><a href={ href } onClick={() => win.navigator.msSaveOrOpenBlob(blob, download)}>{ "Скачать файл" }</a></div>
        } else {
            bodyEl = <div><a href={ href } download={ download }>{ "Скачать файл" }</a></div>
        }
      } else {
        bodyEl = <pre>Download headers detected but your browser does not support downloading binary via XHR (Blob).</pre>
      }

      // Anything else (CORS)
    } else if (/json/i.test(contentType)) {
      // JSON
      try {
        body = JSON.stringify(JSON.parse(content), null, "  ")
      } catch (error) {
        body = "can't parse JSON.  Raw result:\n\n" + content
      }

      bodyEl = <HighlightCode downloadable fileName={`${downloadName}.json`} value={ body } />

      // XML
    } else if (/xml/i.test(contentType)) {
      body = formatXml(content, {
        textNodesOnSameLine: true,
        indentor: "  "
      })
      bodyEl = <HighlightCode downloadable fileName={`${downloadName}.xml`} value={ body } />

      // HTML or Plain Text
    } else if (toLower(contentType) === "text/html" || /text\/plain/.test(contentType)) {
      bodyEl = <HighlightCode downloadable fileName={`${downloadName}.html`} value={ content } />

      // Image
    } else if (/^image\//i.test(contentType)) {
      if(contentType.includes("svg")) {
        bodyEl = <div> { content } </div>
      } else {
        bodyEl = <img style={{ maxWidth: "100%" }} src={ window.URL.createObjectURL(content) } />
      }

      // Audio
    } else if (/^audio\//i.test(contentType)) {
      bodyEl = <pre><audio controls><source src={ url } type={ contentType } /></audio></pre>
    } else if (typeof content === "string") {
      bodyEl = <HighlightCode downloadable fileName={`${downloadName}.txt`} value={ content } />
    } else if ( content.size > 0 ) {
      // We don't know the contentType, but there was some content returned
      if(parsedContent) {
        // We were able to squeeze something out of content
        // in `updateParsedContent`, so let's display it
        bodyEl = <div>
          <p className="i">
            Unrecognized response type; displaying content as text.
          </p>
          <HighlightCode downloadable fileName={`${downloadName}.txt`} value={ parsedContent } />
        </div>

      } else {
        // Give up
        bodyEl = <p className="i">
          Unrecognized response type; unable to display.
        </p>
      }
    } else {
      // We don't know the contentType and there was no content returned
      bodyEl = null
    }

    return ( !bodyEl ? null : <div>
        <h5>Тело ответа</h5>
        { bodyEl }
      </div>
    )
  }
}
