import React, { useEffect, useState } from 'react'
import { connect } from "@argent/get-starknet"
import { CallData, Contract, Provider, cairo, uint256 } from 'starknet'
import { ERC20_CONTRACT_ABI, ETH_CONTRACT_ADDRESS } from '../Constants/constants'
import hex2ascii from "hex2ascii";

import '../CSS/Home.css'

function Home() {

    const [provider, setProvider ] = useState()
    const [starknet, setStarknet] = useState()
    const [walletAddress, setWalletAddress] = useState("")
    const [connetWalletBtn, setConnetWalletBtn] = useState("Connect")
    const [sendTokenBtn, setSendTokenBtn] = useState("Transfer Token")
    const [recipientAddress, setRecipientAddress] = useState("")
    const [amountToSend, setAmountToSend] = useState()
    const [tokenName, setTokenName] = useState("")

    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isWalletConnected, setIsWalletConnected] = useState(false);
    const [availableFunds, setAvailableFunds] = useState(0);

    // Connect dApp to ArgentX or Braavos broweser wallet.
    const connectWallet = async() => {

        try {
            let starknet = await connect()
            setStarknet(starknet)
            console.log("starknet.account.address", starknet.account.address)
            setWalletAddress(starknet.account.address)
            let _provider = new Provider({ sequencer: { baseUrl: starknet.account.provider.baseUrl } });
            setProvider(_provider)
            // console.log("starknet.account.baseUrl", starknet.account.provider.baseUrl)
            setConnetWalletBtn("Connected")
            handleOpenPopup(true)
            setIsWalletConnected(true)
        } catch (error) {
            alert("Unable to connect")
            console.log(error)
        }
    }

    useEffect(() => {
      if(isWalletConnected){
        getUserBalance()
      }
    }, )
       
    const readContractDetails = async() => {
        const contractInstance = new Contract( ERC20_CONTRACT_ABI, ETH_CONTRACT_ADDRESS ,provider);
        // Reading token name from the contract
        // It returns Decimal. Converting it to Hex -> Text 
        let tokenName = await contractInstance.name()
        let toHex = tokenName.name.toString(16);
        let name = hex2ascii(toHex);
        setTokenName(name);
        // console.log(name);

        // Reading user balance
        console.log("walletAddress", walletAddress)
        let tokenBalance = await contractInstance.balanceOf(walletAddress);
        // console.log(uint256.uint256ToBN(tokenBalance.balance).toString())
        tokenBalance  = (uint256.uint256ToBN(tokenBalance.balance).toString() )
        // tokenBalance  = (uint256.uint256ToBN(tokenBalance.balance) )
        console.log("tokenBalance", tokenBalance)
        tokenBalance =  tokenBalance/(1 * 10**18)
        return tokenBalance.toString().slice(0,5)
        
    }
    
    const transferTokens = async() => {
        /* Process to transfer ERC20 tokens
            1. Approve tokens
            2. Transfer tokens
        */
        try {
            setSendTokenBtn("Approving ...")    
            let tokensToSend = amountToSend * 10**18; // sending 0.1 ETH
            let approveTokens = await starknet.account.execute({
                    contractAddress: ETH_CONTRACT_ADDRESS, // ERC20 token addrss(ETH)
                    entrypoint: 'approve',
                    calldata: CallData.compile({
                        recipient: walletAddress,
                        amount: cairo.uint256(tokensToSend)
                    })
                })
            await provider.waitForTransaction(approveTokens.transaction_hash);
            alert("Token approved!");
            setSendTokenBtn("Send");
            let transferToken = await starknet.account.execute({
                    contractAddress: ETH_CONTRACT_ADDRESS, // ERC20 token addrss(ETH)
                    entrypoint: 'transfer',
                    calldata: CallData.compile({
                        recipient: recipientAddress, // Receiver's address
                        amount: cairo.uint256(tokensToSend)
                    })
                })
            await provider.waitForTransaction(transferToken.transaction_hash);
            alert("Token transferred successfully :)");
            setSendTokenBtn("Token Sent!");

            
        } catch (error) {
            alert("Something went wrong")
            console.log(error)
        }
    }

    const getUserBalance = async () => {
        let bal = await readContractDetails()
        setAvailableFunds(bal);    
    }


// Helper Functions.
    const getRecipientAddress = (e) => {
        setRecipientAddress(e.target.value)
    }
    const getSendingAmount = (e) => {
        setAmountToSend(e.target.value)
    }
    const handleOpenPopup = () => {
        setIsPopupOpen(!isPopupOpen);
    };  
    const handleClosePopup = () => {
        setIsPopupOpen(!isPopupOpen);
    };
    
  return (
    <>
            <div>
                {/* Popup */}
                <button className='ConnectWalletBtn' onClick={connectWallet}>{connetWalletBtn}</button>
                {isPopupOpen && (
                    <div className="popup-container">
                        <div className="popup-content">

                            <div className="modal-contents">

                            <span className="close" onClick={handleClosePopup}>&times;</span>

                            <div className="inputs">

                                <h2>Transfer Tokens</h2> 

                                <h4>Available funds: {availableFunds} {tokenName}</h4>

                                        <input type="text" onChange={getRecipientAddress}  placeholder='Recipient Wallet Address'/>
                                        <input type="number" onChange={getSendingAmount} placeholder='Amount to send'/>

                                        <button onClick={transferTokens}>{sendTokenBtn}</button>
                            </div>
                            
                            </div>
                        </div>
                    </div>
                )}
            </div>
    </> 
  )
}

export default Home