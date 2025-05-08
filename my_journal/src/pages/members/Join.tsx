import type {ChangeEvent, FormEvent} from 'react'
import {useState, useCallback, useRef} from 'react'
import {Link, useNavigate} from 'react-router-dom'

type JoinFormType = Record<'email' | 'pass' | 'mobile' | 'name' | 'nickname', string>
const initialFormState = {email: '', pass: '', mobile: '', name: '', nickname: ''}
export function Join() {
  const [{email, pass, mobile, name, nickname}, setForm] =
    useState<JoinFormType>(initialFormState)
  const changed = useCallback(
    (key: string) => (e: ChangeEvent<HTMLInputElement>) => {
      setForm(obj => ({...obj, [key]: e.target.value}))
    },
    []
  )
  const navigate = useNavigate()

  const emailRef = useRef<HTMLInputElement>(null)
  const passRef = useRef<HTMLInputElement>(null)
  const mobileRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const nicknameRef = useRef<HTMLInputElement>(null)

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (emailRef.current?.value === '') {
      if (emailRef.current !== null) {
        emailRef.current.setAttribute('placeholder', 'Please Check Email')
        emailRef.current.focus()
      }
      return
    }
    if (passRef.current?.value === '') {
      if (passRef.current !== null) {
        passRef.current.setAttribute('placeholder', 'Please Check Password')
        passRef.current.focus()
      }
      return
    }
    if (mobileRef.current?.value === '') {
      if (mobileRef.current !== null) {
        mobileRef.current.setAttribute('placeholder', 'Please Check Mobile')
        mobileRef.current.focus()
      }
      return
    }
    if (nameRef.current?.value === '') {
      if (nameRef.current !== null) {
        nameRef.current.setAttribute('placeholder', 'Please Check Name')
        nameRef.current.focus()
      }
      return
    }
    if (nicknameRef.current?.value === '') {
      if (nicknameRef.current !== null) {
        nicknameRef.current.setAttribute('placeholder', 'Please Check Nickname')
        nicknameRef.current.focus()
      }
      return
    }
    regist(email, pass, mobile, name, nickname)
  }
  const regist = async (
    email: string,
    pass: string,
    mobile: string,
    name: string,
    nickname: string
  ) => {
    try {
      new Promise((resolve, reject) => {
        // prettier ignore
        fetch('http://localhost:8080/apiserver/members/register', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            email: email,
            password: pass,
            mobile: mobile,
            name: name,
            nickname: nickname
          })
        })
          .then(res => res.text())
          .then(mid => {
            if (mid) {
              alert('' + mid)
            }
          })
          .catch(err => console.log('Error:', err))
      })
    } catch (error) {
    } finally {
    }
  }

  // prettier-ignore
  return (
    <div
      className="flex items-center justify-center"
      style={{height: '100vh', minHeight: '100vh'}}>
      <div className="flex flex-col rounded items-center bg-gray-200 justify-center flex-1 max-w-sm mx-auto">
        <div className="w-full px-6 py-8 text-black rounded shadow-md">
          <form method="post" onSubmit={onSubmit}>
            <h1 className="mb-8 text-4xl text-center">My Journal</h1>
            <input type="text" name="email" ref={emailRef} className="input input-accent w-full p-1 mb-4 text-xl rounded-lg size-15"
              placeholder="Email" onChange={changed('email')} />
            <input type="password" name="pass" ref={passRef} className="input input-accent w-full p-1 mb-4 text-xl rounded-lg size-15"
              placeholder="Password" onChange={changed('pass')}/>
            <input type="text" name="mobile" ref={mobileRef} className="input input-accent w-full p-1 mb-4 text-xl rounded-lg size-15"
              placeholder="Mobile" onChange={changed('mobile')} />
            <input type="text" name="name" ref={nameRef} className="input input-accent w-full p-1 mb-4 text-xl rounded-lg size-15"
              placeholder="Name" onChange={changed('name')} />
            <input type="text" name="nickname" ref={nicknameRef} className="input input-accent w-full p-1 mb-4 text-xl rounded-lg size-15"
              placeholder="Nickname" onChange={changed('nickname')} />
            <button
              className="w-full p-3 mb-4 text-2xl text-black bg-gray-300 rounded size-15"
              type="submit">
              Join
            </button>
          </form>
          <span className="mt-6 text-lg text-grey-dark font-sans md:font-serif">
            Create account?
            <Link className="ml-5 text-lg" to="/join">
              Join
            </Link>
          </span>
        </div>
      </div>
    </div>
  )
}
