// import { useState, useEffect } from "react"

// function isMobileDevice () {
//   return 'ontouchstart' in window || 'onmsgesturechange' in window
// }

// async function connect (onConnected) {

//   if (!window.ethereum) {
//     alert("Get MetaMask!")
//     return
//   }


//   const accounts = await window.ethereum.request({
//     method: "eth_requestAccounts",
//   })

//   onConnected(accounts[0])
// }




function NoticeNoArtifact () {
  // const [userAddress, setUserAddress] = useState("")

  return (
    <>
      <p>
        ⚠️ Cannot find <span className="code">SimpleStorage</span> contract artifact.
        Please complete the above preparation first, then restart the react dev server.
      </p>
      {/* <button onClick={() => { window.ethereum.enable() }}>
        Connect to MetaMask
      </button> */}
    </>
  )
}

export default NoticeNoArtifact
