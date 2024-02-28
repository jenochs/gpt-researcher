const GPTResearcher = (() => {
    const init = () => {
      // Not sure, but I think it would be better to add event handlers here instead of in the HTML
      //document.getElementById("startResearch").addEventListener("click", startResearch);
      document.getElementById("copyToClipboard").addEventListener("click", copyToClipboard);
      document.getElementById("askButton").addEventListener("click", handleAsk);
      document.getElementById("updateReportButton").addEventListener("click", updateReport);


      updateState("initial");
    }

    const startResearch = () => {
      document.getElementById("output").innerHTML = "";
      document.getElementById("reportContainer").innerHTML = "";
      updateState("in_progress")
  
      addAgentResponse({ output: "🤔 Thinking about research questions for the task..." });
  
      listenToSockEvents();
    };
  
    const listenToSockEvents = () => {
      const { protocol, host, pathname } = window.location;
      const ws_uri = `${protocol === 'https:' ? 'wss:' : 'ws:'}//${host}${pathname}ws`;
      const converter = new showdown.Converter();
      const socket = new WebSocket(ws_uri);
  
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'logs') {
          addAgentResponse(data);
        } else if (data.type === 'report') {
          writeReport(data, converter);
        } else if (data.type === 'path') {
          updateState("finished")
          updateDownloadLink(data);

        }
      };
  
      socket.onopen = (event) => {
        const task = document.querySelector('input[name="task"]').value;
        const report_type = document.querySelector('select[name="report_type"]').value;
        const agent = document.querySelector('input[name="agent"]:checked').value;
  
        const requestData = {
          task: task,
          report_type: report_type,
          agent: agent,
        };
  
        socket.send(`start ${JSON.stringify(requestData)}`);
      };
    };
  
    const addAgentResponse = (data) => {
      const output = document.getElementById("output");
      output.innerHTML += '<div class="agent_response">' + data.output + '</div>';
      output.scrollTop = output.scrollHeight;
      output.style.display = "block";
      updateScroll();
    };
  
    const writeReport = (data, converter) => {
      const reportContainer = document.getElementById("reportContainer");
      const markdownOutput = converter.makeHtml(data.output);
      reportContainer.innerHTML += markdownOutput;
      updateScroll();
    };
  
    const updateDownloadLink = (data) => {
      const path = data.output;
      document.getElementById("downloadLink").setAttribute("href", path);
    };
  
    const updateScroll = () => {
      window.scrollTo(0, document.body.scrollHeight);
    };
  
    const copyToClipboard = () => {
      const textarea = document.createElement('textarea');
      textarea.id = 'temp_element';
      textarea.style.height = 0;
      document.body.appendChild(textarea);
      textarea.value = document.getElementById('reportContainer').innerText;
      const selector = document.querySelector('#temp_element');
      selector.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    };

    const handleAsk = () => {
      const reportText = document.getElementById('reportContainer').innerText;
      // Pass the reportText to a similar function as startResearch, possibly to ask a follow-up question or initiate new research
      console.log('Report text:', reportText);

      startResearchWithText(reportText);
    };

    const startResearchWithText = (text) => {
      // Reset the output and report container just like in startResearch
      document.getElementById("output").innerHTML = "";
      document.getElementById("reportContainer").innerHTML = "";
      updateState("in_progress");
      // Assuming you have a way to send this text to your backend or research service
      // This could involve modifying the listenToSockEvents or directly invoking a WebSocket send with the new text
      // For demonstration, we'll log the text and call listenToSockEvents to simulate starting new research
      console.log("Starting new research with text:", text);
      listenToSockEvents(); // You may need to modify this function to handle the new research text
    };

    const updateReport = () => {
      // Implementation depends on your specific requirements
      // For example, refreshing the report data
      startResearch();
    };

    const updateState = (state) => {
      var status = "";
      switch (state) {
        case "in_progress":
          status = "Research in progress..."
          setReportActionsStatus("disabled");
          break;
        case "finished":
          status = "Research finished!";
          setReportActionsStatus("enabled");
          showFollowOnQuestionForm(); // Call to show the follow-on question form
          break;
        case "error":
          status = "Research failed!"
          setReportActionsStatus("disabled");
          break;
        case "initial":
          status = ""
          setReportActionsStatus("hidden");
          break;
        default:
          setReportActionsStatus("disabled");
      }
      document.getElementById("status").innerHTML = status;
      if (document.getElementById("status").innerHTML == "") {
        document.getElementById("status").style.display = "none";
      } else {
        document.getElementById("status").style.display = "block";
      }
    }

    /**
     * Shows or hides the download and copy buttons
     * @param {str} status Kind of hacky. Takes "enabled", "disabled", or "hidden". "Hidden is same as disabled but also hides the div"
     */
    const setReportActionsStatus = (status) => {
      const reportActions = document.getElementById("reportActions");
      // Disable everything in reportActions until research is finished

      if (status == "enabled") {
        reportActions.querySelectorAll("a").forEach((link) => {
          link.classList.remove("disabled");
          link.removeAttribute('onclick');
          reportActions.style.display = "block";
        });
      } else {
        reportActions.querySelectorAll("a").forEach((link) => {
          link.classList.add("disabled");
          link.setAttribute('onclick', "return false;");
        });
        if (status == "hidden") {
          reportActions.style.display = "none";
        }
      }
    }
    const showFollowOnQuestionForm = () => {
      document.querySelector('.follow-on-question').style.display = 'block'; // Show the follow-on question form
      document.getElementById('followOnForm').addEventListener('submit', handleFollowOnQuestionSubmit);
    };

    const handleFollowOnQuestionSubmit = (event) => {
        event.preventDefault();
        const followOnQuestion = document.getElementById('followOnQuestion').value;
        
        // Logic to handle the follow-on question (similar to startResearch)

        console.log('Follow-on question:', followOnQuestion); 

        // Call startResearch or a similar function here, with updated question.


    };

    document.addEventListener("DOMContentLoaded", init);
    return {
      startResearch,
      copyToClipboard,
    };
  })();