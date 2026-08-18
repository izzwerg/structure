import Person from './Person/Person';
import PersonModel from './PersonModel/PersonModel';
import './Right.css'
import Table from './Table/Table';
import Tree from './Tree/Tree';
import Archive from './Archive/Archive';
import { useAuth } from '../context/AuthContext';


function Right({ page }) {
    const { canMod } = useAuth();
    return (
        <div className='right_container'>
            {page === 'tree' && <Tree />}
            {page === 'table' && <Table />}
            {page === 'person' && <Person />}
            {canMod && page === 'person_model' && <PersonModel />}
            {page === 'person_archive' && <Archive />}
        </div>
    )
}

export default Right