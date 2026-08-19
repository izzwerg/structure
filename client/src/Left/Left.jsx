import './Left.css'
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';


function Left({ isNavOpen, setIsNavOpen, page, setPage, handleLogout }) {

    const { canMod } = useAuth();

    function handleNavClick() {
        setIsNavOpen(!isNavOpen);
    }

    return (
        <div className={clsx('left_container', { 'nav_open': isNavOpen, 'nav_closed': !isNavOpen })}>
            <div className='nav_buttons_container'>
                <div className='nav_switcher pointer'
                    onClick={() => handleNavClick()}
                >
                    <img src="menu.svg" alt="menu" className={clsx('switcher_logo', { 'nav_open': isNavOpen, 'nav_closed': !isNavOpen })} />
                </div>
                <div className={clsx('nav_btn pointer', { 'active': page === 'tree' })} onClick={() => setPage('tree')}>
                    <img src="tree.svg" alt="tree" className='nav_btn_logo' />
                    <span className='nav_btn_text'>СТРУКТУРА</span>
                </div>
                <div className={clsx('nav_btn pointer', { 'active': page === 'table' })} onClick={() => setPage('table')}>
                    <img src="table.svg" alt="table" className='nav_btn_logo' />
                    <span className='nav_btn_text'>ТАБЛИЦЯ</span>
                </div>
                <div className={clsx('nav_btn pointer', { 'active': page === 'person' })} onClick={() => setPage('person')}>
                    <img src="person.svg" alt="person" className='nav_btn_logo' />
                    <span className='nav_btn_text'>КАРТКИ</span>
                </div>

                <div className={clsx('nav_btn pointer', { 'active': page === 'person_archive' })} onClick={() => setPage('person_archive')}>
                    <img src="person.svg" alt="person" className='nav_btn_logo' />
                    <span className='nav_btn_text'>АРХІВ</span>
                </div>
            </div>
            <div className='nav_buttons_container'>
                {canMod && <div className={clsx('nav_btn pointer', { 'active': page === 'person_model' })} onClick={() => setPage('person_model')}>
                    <img src="gear.svg" alt="person" className='nav_btn_logo' />
                    <span className='nav_btn_text'>НАЛАШТУВАННЯ</span>
                </div>}
                <button onClick={handleLogout} className='logout_btn pointer'>
                    <img src="mono-logout.svg" alt="person" className='nav_btn_logo' />
                </button>
            </div>

        </div>
    )
}

export default Left