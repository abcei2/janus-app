
import './App.css';
import React, { useState } from 'react';

// import Video from 'react-native-video';
var JanusClient = require('janus-videoroom-client').Janus;
var client = new JanusClient({
  url: 'ws://localhost:8188'
});
var pc = null;

function negotiate(answer_json,offer_json) {
  pc.addTransceiver('video', {direction: 'recvonly'});
  return pc.createOffer().then(function(offer) {
      console.log("offer",offer.sdp)
      return pc.setLocalDescription(offer);
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
      return pc.setRemoteDescription(offer_json);  
  }).catch(function(e) {
      alert(e);
  });
}
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
              console.log(offerSdp,listenerHandle);
              session.videoRoom().publishFeed(1234, offerSdp).then((publisherHandle)=>{
                var answerSdp = publisherHandle.getAnswer();
                console.log(answerSdp)
                
                let answer_json={sdp:answerSdp,type:"answer"};
                let offer_json={sdp:offerSdp,type:"offer"};
                negotiate(answer_json,offer_json);
              
              });
          });
      }
    });
    
    return session.videoRoom().defaultHandle();
  }).then((videoRoomHandle)=>{
    // videoRoomHandle.connect()
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
  console.log(evt.streams[0].getTracks(),document.getElementById('video'))
  if (evt.track.kind === 'video') {
    // console.log("asdasd")
    document.getElementById('video').srcObject = evt.streams[0];
    
    console.log(evt,document.getElementById('video'))
    // setVideoSrc("/example1.mp4")
  } else {
    document.getElementById('audio').srcObject = evt.streams[0];
  }
});
function App() {

  const [video_src, setVideoSrc] = useState("/example2.m4v");    
  
  // connect audio / video


 
  client.connect();   
  return (
      <div id="media" height="400px" width="400px">
        <h2>Media</h2>
        {video_src}
        <video id="video" autoPlay={true}>
        </video>
        
        <h2>Media</h2>
      </div>
  );
}

export default App;
