import axios from "axios";
import userModel from "../models/userModel.js";
import FormData from "form-data";
import fs from 'fs'
const generateImage = async (req,res)=>{
    try {
        
   const {userId,prompt}=req.body
  const user = await userModel.findById(userId)

  if(!user || !prompt){
    return res.json({success:false, message:'Missing Details'})
  }
  if(user.creditBalance <= 0){
    return res.json({success:false, message:'No Credit Balance',creditBalance:user.creditBalance})
  }

//   const formData = new FormData()
//   formData.append('prompt',prompt)

  const {data} = await axios.post('https://api-inference.huggingface.co/models/strangerzonehf/Flux-Midjourney-Mix2-LoRA',
    prompt,
    {
        headers: {
            Authorization: process.env.IMAGE_GENERATOR_API, 
            "Content-Type": "multipart/form-data",
        },
        responseType: "arraybuffer",
        
    }
  )
  const base64Image =Buffer.from(data,'binary').toString('base64')
  const resultImage = `data:image/png;base64,${base64Image}`

  const timestamp = Date.now();
  
  const filePath = `../server/generated-images/generated_image_${timestamp}.png`;
  fs.writeFile(filePath, data, (err) => {
      if (err) {
          console.error("Error saving the image:", err);
      } else {
          console.log("Image saved successfully to", filePath);
      }
  });

  await userModel.findByIdAndUpdate(user._id,{
    creditBalance:user.creditBalance - 1
  })

  res.json({success:true,message: 'Image Generated',
    creditBalance:user.creditBalance - 1 , resultImage })
    } catch (error) {
        console.log(error.message);
    res.json({success:false,message:error.message})
    }
}

export default generateImage;