import {SyntheticEvent, useCallback, useEffect, useState, useRef, FormEvent} from 'react'
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
  thumbnailURL?: string
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

export function Post() {
  const token = useToken()
  const navigate = useNavigate()
  const [journalDTO, setJournalDTO] = useState<JournalDTO | null>(null)
  const refFile = useRef<HTMLInputElement | null>(null)

  const [query] = useSearchParams()
  const page = query.get('page') || '1'
  const type = query.get('type') || ''
  const keyword = query.get('keyword') || ''
  const jno = query.get('jno') || ''

  useEffect(() => {
    if (token && jno) {
      const url = `http://localhost:8080/apiserver/journal/post/${jno}`
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
          console.log('Post data:', data)
          setJournalDTO(data.journalDTO)
        })
        .catch(err => console.log('Error:', err))
      loadCommentsJSON()
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

  const addDefaultImg = (e: SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = defaultImg
  }

  const goList = (page: string, type: string, keyword: string) => {
    navigate(`/list?page=${page}&type=${type}&keyword=${keyword}`, {replace: true})
  }

  const goModify = (page: string, type: string, keyword: string) => {
    navigate(`/modify?jno=${jno}&page=${page}&type=${type}&keyword=${keyword}`, {
      replace: true
    })
  }

  const loadCommentsJSON = () => {
    const url = 'http://localhost:8080/apiserver/comments/all/'
    const listGroup = document.querySelector('.comments-list')
    fetch(url + jno, {method: 'GET', headers: {Authorization: `Bearer ${token}`}})
      .then(response => response.json())
      .then(data => {
        let str = ''
        for (let i = 0; i < data.length; i++) {
          str += `<div class="card-body form-control mb-1"
            onmouseover="this.style.background='#d6e6ff'"
            onmouseout="this.style.background='white'"
            data-mid="${data[i].mid}" data-text="${data[i].text}"
            data-likes="${data[i].likes}" data-nickname="${data[i].nickname}"
            data-email="${data[i].email}" data-cno="${data[i].cno}"
            style="padding: 5px 20px;cursor:pointer;">
            <div style="display:inline-block;width:68%;">
              <h6 style="display:inline-block;width:70px">${data[i].cno}</h6>
              <h5 class="card-text" style="display:inline-block;">${data[i].text}
              ${data[i].likes ? '♥' : ''}</h5>
            </div>
            <div style="display:inline-block;width:30%;text-align: right;right-padding:12px;">
              <span class="card-subtitle text-muted" style="font-size:10px">${
                data[i].nickname
              } /
               ${data[i].email}</span>
              <span class="card-subtitle text-muted"
              style="display:inline-block;width:150px;color:rgb(148 163 184);font-size:12px;"
              >${transDateFormat(data[i].regDate)}</span>
            </div>
          </div>`
        }
        if (listGroup) listGroup.innerHTML = str
      })
  }

  const handleRemoveJournal = useCallback(async () => {
    if (!token || !journalDTO?.jno) return

    if (!confirm('정말로 이 저널을 삭제하시겠습니까?')) return

    const pageRequestDTO = {
      page,
      size: '10',
      type,
      keyword
    }

    try {
      const response = await fetch(
        `http://localhost:8080/journal/remove/${journalDTO.jno}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(pageRequestDTO)
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const result = await response.json()
      console.log('Journal 삭제 완료:', result)
      goList(result.page, result.type, result.keyword)
    } catch (err) {
      console.error('Error occurred: ', err.message)
    }
  }, [token, journalDTO, page, type, keyword, goList])

  return (
    <>
      <header
        className="masthead"
        style={{backgroundImage: `url('assets/img/home-bg.jpg')`}}>
        <div className="container position-relative px-4 px-lg-5">
          <div className="row gx-4 gx-lg-5 justify-content-center">
            <div className="col-md-10 col-lg-8 col-xl-7">
              <div className="post-heading">
                <h1>Man must explore, and this is exploration at its greatest</h1>
                <h2 className="subheading">
                  Problems look mighty small from 150 miles up
                </h2>
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
              <form>
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
                  <label>Title</label>
                  <input
                    type="text"
                    name="title"
                    value={journalDTO?.title || ''}
                    className="form-control"
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label>Content</label>
                  <input
                    type="text"
                    name="content"
                    value={journalDTO?.content || ''}
                    className="form-control"
                    readOnly
                  />
                </div>
                <div style={{marginBottom: '30px'}}>
                  <label>Comments Count</label>
                  <input
                    type="text"
                    name="commentsCnt"
                    className="form-control"
                    readOnly
                    value={journalDTO?.commentsCnt ?? 0}
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
                <div className="form-group">
                  <input type="hidden" name="page" value={page} />
                  <input type="hidden" name="type" value={type} />
                  <input type="hidden" name="keyword" value={keyword} />
                  <button
                    type="button"
                    className="btn btn-primary btnModi p-2"
                    onClick={e => {
                      e.preventDefault()
                      goModify(page, type ?? '', keyword ?? '')
                    }}>
                    Modify
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btnRemove p-2"
                    onClick={handleRemoveJournal}
                    style={{marginLeft: '10px'}}>
                    Delete
                  </button>
                  <button
                    type="button"
                    className="btn btn-info btnBack p-2"
                    onClick={() => {
                      goList(page, type ?? '', keyword ?? '')
                    }}
                    style={{marginLeft: '10px'}}>
                    Back
                  </button>
                </div>
              </form>
              <div className="uploadResult">
                <ul>
                  {journalDTO?.photosDTOList.map((photosDTO, idx) => (
                    <li key={idx} style={{cursor: 'pointer'}}>
                      {photosDTO.thumbnailURL == null ? (
                        <img
                          key={idx}
                          src={defaultImg}
                          style={{display: 'inline-block', marginRight: '20px'}}
                          alt="Feed Thumbnail"
                        />
                      ) : (
                        <img
                          key={idx}
                          src={`http://localhost:8080/apiserver/display?fileName=${photosDTO.thumbnailURL}`}
                          style={{display: 'inline-block', marginRight: '20px'}}
                          alt="Feed Thumbnail"
                          onError={addDefaultImg}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className="list-group comments-list"
                style={{marginBottom: '50px'}}></div>
              <div
                className="modal fade"
                id="myModal"
                tabIndex={-1}
                aria-labelledby="exampleModalLabel"
                aria-hidden="true">
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h1 className="modal-title fs-5" id="exampleModalLabel">
                        Modal title
                      </h1>
                      <button
                        type="button"
                        className="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close"></button>
                    </div>
                    <div className="modal-body"></div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        data-bs-dismiss="modal">
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    </>
  )
}
