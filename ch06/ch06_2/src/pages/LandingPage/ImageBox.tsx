import {useAtom} from 'jotai'
import {FC} from 'react'
import {imageNameAtom} from '../../jotai/imageNameAtom'

export type ImageUrlProps = {
  imageUrlList?: string[]
}

const ImageBox: FC<ImageUrlProps> = ({imageUrlList}) => {
  const [imageName, setImageName] = useAtom(imageNameAtom)

  return (
    <div>
      <h4 className="text-5xl text-center">Photos</h4>
      <div className="flex flex-row justify-center">
        {imageUrlList?.map((url, index) => (
          <img
            src={url}
            key={index}
            onClick={() => {
              setImageName(url)
            }}
          />
        ))}
      </div>
    </div>
  )
}
export default ImageBox
