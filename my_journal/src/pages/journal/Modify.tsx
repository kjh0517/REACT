import React, {useState, useEffect, useCallback, useRef, FormEvent} from 'react'
import {useNavigate, useSearchParams} from 'react-router-dom'
import defaultImg from '../../assets/no-img.gif'
import {useToken} from '../../hooks'

interface MembersDTO {
  mid: number
  name: string
  nickname: string
  email: string
  mobile: string
}

interface PhotosDTO {
  uuid: string
  photosName: string
  path: string
}

interface JournalDTO {
  jno: number
  title: string
  content: string
  photosDTOList: PhotosDTO[]
  commentsCnt: number
  membersDTO: MembersDTO
  likes: number
  regDate: string
  modDate: string
}

interface PageRequestDTO {
  page: string
  size: string
  type: string
  keyword: string
}

export function Modify() {
  const token = useToken()
  const navigate = useNavigate()
  const [journalDTO, setJournalDTO] = useState<JournalDTO | null>(null)
  const [uploadedPhotos, setUploadedPhotos] = useState<PhotosDTO[]>([])
  const [deletedPhotos, setDeletedPhotos] = useState<string[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [inputHiddens, setInputHiddens] = useState('')

  const refFile = useRef<HTMLInputElement | null>(null)
  const refTitle = useRef<HTMLInputElement | null>(null)
  const refContent = useRef<HTMLTextAreaElement | null>(null)

  const [query] = useSearchParams()
  const page = query.get('page') || '1'
  const type = query.get('type') || ''
  const keyword = query.get('keyword') || ''
  const jno = query.get('jno') || ''

  useEffect(() => {
    const queryParams = []
    if (page) queryParams.push(`page=${page}`)
    if (type) queryParams.push(`type=${type}`)
    if (keyword) queryParams.push(`keyword=${keyword}`)

    let url = `http://localhost:8080/apiserver/journal/modify/${jno}`
    if (queryParams.length > 0) url += '?' + queryParams.join('&')

    if (token && jno) {
      fetch(url, {
        method: 'GET',
        headers: {Authorization: `Bearer ${token}`}
      })
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`)
          }
          return res.json()
        })
        .then(data => {
          setJournalDTO(data.journalDTO)
          setTitle(data.journalDTO.title)
          setContent(data.journalDTO.content)
          console.log('Fetched journalDTO:', data.journalDTO)
        })
        .catch(err => console.log('Error:', err))
    }
  }, [jno, token])

  const transDateFormat = useCallback((d: string) => {
    const date = new Date(Date.parse(d ?? ''))
    return (
      [
        date.getFullYear(),
        padTwoDigits(date.getMonth() + 1),
        padTwoDigits(date.getDate())
      ].join('-') +
      ' ' +
      [
        padTwoDigits(date.getHours()),
        padTwoDigits(date.getMinutes()),
        padTwoDigits(date.getSeconds())
      ].join(':')
    )
  }, [])

  function padTwoDigits(num: number) {
    return num.toString().padStart(2, '0')
  }

  const addDefaultImg = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = defaultImg
  }

  const goList = (page: string, type: string, keyword: string) => {
    navigate(`/list?page=${page}&type=${type}&keyword=${keyword}`, {replace: true})
  }

  const goPost = (jno: string, page: string, type: string, keyword: string) => {
    navigate(`/post?jno=${jno}&page=${page}&type=${type}&keyword=${keyword}`)
  }

  const checkExtension = useCallback((fileName: string, fileSize: number) => {
    const maxSize = 1024 * 1024 * 10
    if (fileSize >= maxSize) {
      alert('파일사이즈 초과')
      return false
    }
    const regex = new RegExp('(.*?).(jpg|jpeg|png|gif|bmp|pdf)$', 'i')
    if (!regex.test(fileName)) {
      alert('해당파일 업로드 금지!')
      return false
    }
    return true
  }, [])

  const showResult = useCallback(
    (
      arr: {
        fileName: string
        folderPath: string
        uuid: string
        imageURL: string
        thumbnailURL: string
      }[]
    ) => {
      const uploadUL = document.querySelector('.uploadResult ul')
      let str = ''
      const url = 'http://localhost:8080/apiserver/display'
      const newPhotos: PhotosDTO[] = arr.map(item => ({
        uuid: item.uuid,
        photosName: item.fileName,
        path: item.folderPath.replace(/\\/g, '/')
      }))

      for (let i = 0; i < arr.length; i++) {
        str += `<li data-name='${arr[i].fileName}' data-path='${arr[i].folderPath}'
          data-uuid='${arr[i].uuid}' data-file='${arr[i].imageURL}'><div>
          <button class="removeBtn" type="button">X</button>
          <img src="${url}?fileName=${arr[i].thumbnailURL.replace(/\\/g, '/')}">
        </div></li>`
      }
      uploadUL!.innerHTML = str
      setUploadedPhotos(newPhotos)

      const removeBtns = document.querySelectorAll('.removeBtn')
      for (let i = 0; i < removeBtns.length; i++) {
        removeBtns[i].onclick = function () {
          const removeUrl = 'http://localhost:8080/apiserver/removeFile?fileName='
          const targetLi = this.closest('li') as HTMLElement
          const fileName = targetLi.dataset.file
          fetch(removeUrl + fileName, {
            method: 'POST',
            headers: {Authorization: `Bearer ${token}`}
          })
            .then(response => response.json())
            .then(json => {
              if (json === true) targetLi.remove()
              document.querySelector('#custom-label')!.innerHTML = ''
              document.querySelector('#fileInput')!.value = ''
            })
            .catch(err => console.log('Error occurred: ', err))
        }
      }
    },
    [token]
  )

  const fileChange = useCallback(() => {
    const formData = new FormData()
    const fileList = refFile.current?.files ?? []
    const fileListLength = fileList.length ?? 0
    let appended = false

    for (let i = 0; i < fileListLength; i++) {
      if (!checkExtension(fileList[i]?.name, fileList[i].size)) {
        if (refFile.current?.value !== undefined) refFile.current.value = ''
        appended = false
        break
      }
      formData.append('uploadFiles', fileList[i])
      appended = true
    }
    if (!appended) {
      alert('파일의 타입이 알맞지 않습니다.')
      return
    }
    if (token) {
      fetch('http://localhost:8080/apiserver/uploadAjax', {
        method: 'POST',
        body: formData,
        headers: {Authorization: `Bearer ${token}`}
      })
        .then(response => response.json())
        .then(json => {
          console.log('Uploaded photos:', json)
          showResult(json)
        })
        .catch(err => console.log('Error:', err))
    }
  }, [token, checkExtension, showResult])

  const handleRemoveExistingPhoto = useCallback(
    (photo: PhotosDTO) => {
      if (!token) return

      let fileName = `${photo.path}/${photo.uuid}_${photo.photosName}`.replace(/\\/g, '/')
      console.log('Removing file:', fileName)

      fetch(
        `http://localhost:8080/apiserver/removeFile?fileName=${encodeURIComponent(
          fileName
        )}`,
        {
          method: 'POST',
          headers: {Authorization: `Bearer ${token}`}
        }
      )
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          return response.json()
        })
        .then(json => {
          if (json === true) {
            setDeletedPhotos(prev => [...prev, photo.uuid])
            setJournalDTO(prev => {
              if (!prev) return prev
              const updatedPhotos = prev.photosDTOList.filter(p => p.uuid !== photo.uuid)
              return {
                ...prev,
                photosDTOList: updatedPhotos
              }
            })
          }
        })
        .catch(err => console.log('Error occurred: ', err))
    },
    [token]
  )

  const modifyData = {
    journalDTO: {
      jno: journalDTO?.jno,
      title,
      content,
      membersDTO: {
        mid: journalDTO?.membersDTO?.mid ?? 1
      },
      photosDTOList: (
        journalDTO?.photosDTOList.filter(p => !deletedPhotos.includes(p.uuid)) || []
      )
        .map(photo => ({
          uuid: photo.uuid,
          photosName: photo.photosName,
          path: photo.path.replace(/\\/g, '/')
        }))
        .concat(uploadedPhotos)
    },
    pageRequestDTO: {
      page,
      size: '10',
      type,
      keyword
    }
  }

  const handleModify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    console.log('modifyData:', JSON.stringify(modifyData, null, 2))

    const response = await fetch('http://localhost:8080/apiserver/journal/modify', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(modifyData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Server error:', errorText)
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('수정완료:', result)

    goPost(String(journalDTO?.jno), page, type, keyword)
  }

  return (
    <>
      <header
        className="masthead"
        style={{backgroundImage: `url('assets/img/home-bg.jpg')`}}>
        <div className="container position-relative px-4 px-lg-5">
          <div className="row gx-4 gx-lg-5 justify-content-center">
            <div className="col-md-10 col-lg-8 col-xl-7">
              <div className="post-heading">
                <h1>그만해...</h1>
                <h2 className="subheading">힘들어...</h2>
                <span className="meta">
                  Posted by <a href="#!"> Start Journal on</a> on August 24, 2023
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>
      <article className="mb-4">
        <div className="container px-4 px-lg-5">
          <div className="row gx-4 gx-lg-5 justify-content-center">
            <div className="col-md-10 col-lg-8 col-xl-7">
              <form id="frmSend" onSubmit={handleModify}>
                <div className="form-group">
                  <label>Jno</label>
                  <input
                    type="text"
                    value={journalDTO?.jno || ''}
                    name="jno"
                    className="form-control"
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="title">Title</label>
                  <input
                    className="form-control"
                    id="title"
                    type="text"
                    name="title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="content">Content</label>
                  <input
                    className="form-control"
                    id="content"
                    type="text"
                    name="content"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                  />
                </div>
                <div style={{marginBottom: '30px'}}>
                  <label>Likes</label>
                  <input
                    type="text"
                    name="likes"
                    readOnly
                    className="form-control"
                    value={journalDTO?.likes ?? 0}
                  />
                </div>
                <div className="form-group">
                  <label>RegDate</label>
                  <input
                    type="text"
                    className="form-control"
                    value={transDateFormat(journalDTO?.regDate ?? '')}
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label>ModDate</label>
                  <input
                    type="text"
                    className="form-control"
                    value={transDateFormat(journalDTO?.modDate ?? '')}
                    readOnly
                  />
                </div>
                <div className="form-floating">
                  <input
                    className="custom-file-input form-control files"
                    id="fileInput"
                    type="file"
                    accept="image/*"
                    ref={refFile}
                    onChange={fileChange}
                    multiple
                  />
                </div>
                <div
                  className="box"
                  dangerouslySetInnerHTML={{__html: inputHiddens}}></div>
                <br />
                <div className="form-group">
                  <input type="hidden" name="page" value={page} />
                  <input type="hidden" name="type" value={type} />
                  <input type="hidden" name="keyword" value={keyword} />
                  <button type="submit" className="btn btn-primary btnModi p-2">
                    Modify
                  </button>
                  <button
                    type="button"
                    className="btn btn-info btnBack p-2"
                    onClick={() => goList(page, type ?? '', keyword ?? '')}>
                    Back
                  </button>
                </div>
              </form>
              <div className="uploadResult">
                <ul>
                  {journalDTO?.photosDTOList.map((photosDTO, idx) => (
                    <li
                      key={photosDTO.uuid}
                      style={{cursor: 'pointer', position: 'relative'}}>
                      {!photosDTO.path ||
                      deletedPhotos.includes(photosDTO.uuid) ? null : (
                        <>
                          <img
                            src={`http://localhost:8080/apiserver/display?fileName=${photosDTO.path.replace(
                              /\\/g,
                              '/'
                            )}/s_${photosDTO.uuid}_${photosDTO.photosName}`}
                            style={{display: 'inline-block', marginRight: '20px'}}
                            alt="Feed Thumbnail"
                            onError={addDefaultImg}
                          />
                          <button
                            className="removeBtn"
                            type="button"
                            style={{
                              position: 'absolute',
                              top: '5px',
                              right: '25px',
                              background: 'red',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleRemoveExistingPhoto(photosDTO)}>
                            X
                          </button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </article>
    </>
  )
}
