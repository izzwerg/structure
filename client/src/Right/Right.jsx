import Person from './Person/Person';
import PersonModel from './PersonModel/PersonModel';
import './Right.css'
import Table from './Table/Table';
import Tree from './Tree/Tree';


function Right({ page }) {
    return (
        <div className='right_container'>
            {page === 'tree' && <Tree />}
            {page === 'table' && <Table />}
            {page === 'person' && <Person />}
            {page === 'person_model' && <PersonModel />}
        </div>
    )
}

export default Right