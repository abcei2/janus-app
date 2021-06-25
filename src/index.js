import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';


var JanusClient = require('janus-videoroom-client').Janus;
var client = new JanusClient({
  url: 'ws://207.246.118.54:8188'
});
var pc = null;

var config = {
  sdpSemantics: 'unified-plan'
};

if (true) {
  config.iceServers = [{urls: ['stun:stun.l.google.com:19302']}];
}

pc = new RTCPeerConnection(config);


client.onConnected(()=>{
  client.createSession().then((session)=>{
    console.log("CREATING SESSION")
    session.videoRoom().getFeeds("1234").then((feeds)=>{
      console.log(feeds)
      for(let feed of feeds) {
        console.log(feed)
        session.videoRoom().listenFeed(1234, feed).then((listenerHandle)=>{

          var offerSdp = listenerHandle.getOffer();
          // console.log(offerSdp,listenerHandle);
          
          listenerHandle.trickle("candidate").then(()=>{
            console.log("asdas")
          });
          let offer_json={sdp:offerSdp,type:"offer"};
          pc.setRemoteDescription(offer_json);

          pc.addTransceiver('video', {direction: 'recvonly'});
          pc.createAnswer().then(function(answer) {
            console.log(answer)
            return pc.setLocalDescription(answer);
          }).then(function() {
            // wait for ICE gathering to complete
            return new Promise(function(resolve) {
                if (pc.iceGatheringState === 'complete') {
                    resolve();
                } else {
                    function checkState() {
                        if (pc.iceGatheringState === 'complete') {
                            pc.removeEventListener('icegatheringstatechange', checkState);
                            resolve();
                        }
                    }
                    pc.addEventListener('icegatheringstatechange', checkState);
                }
            });
          }).then(function() {
            var answer = pc.localDescription;
            listenerHandle.setRemoteAnswer(answer.sdp).then(()=>{
              console.log("ANSWERD SEND",answer.sdp)              
          
            });
            // Send the answer to the remote peer through the signaling server.
          })
          // negotiate(offer_json);
          // session.videoRoom().publishFeed(1234, offerSdp).then((publisherHandle)=>{
          //   var answerSdp = publisherHandle.getAnswer();
          //   listenerHandle.setRemoteAnswer(answerSdp).then(()=>{
          //     console.log("ANSWERD SEND")
              
          
          //     let answer_json={sdp:answerSdp,type:"answer"};
          //     let offer_json={sdp:offerSdp,type:"offer"};
          //     negotiate(answer_json,offer_json);
          //   });
          //   publisherHandle.trickle("aiortc").then(()=>{
          //     console.log("asdas")
          //   });
          
            // });
        });
        break
      }
    });
    
    return session.videoRoom().defaultHandle();
  }).then((videoRoomHandle)=>{
    // console.log(videoRoomHandle.connect())
  })
  .catch((err)=>{
    console.log("SOME ERROR",err)
  })
});

client.onDisconnected(()=>{
  console.log("DISCONNECTED")
    
});
client.onError((err)=>{
  console.log("DISCONNECTED")
});
pc.addEventListener('track', function(evt) {
  console.log(evt.track.kind,evt.streams[0])
  if (evt.track.kind === 'video') {
    document.getElementById('video').srcObject = evt.streams[0];
    
  } else {
    document.getElementById('audio').srcObject = evt.streams[0];
  }
});


client.connect();   


ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
