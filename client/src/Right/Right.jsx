import Person from './Person/Person';
import './Right.css'
import Table from './Table/Table';
import Tree from './Tree/Tree';


function Right({ page }) {
    return (
        <div className='right_container'>
            {page === 'tree' && <Tree />}
            {page === 'table' && <Table />}
            {page === 'person' && <Person />}
        </div>
    )
}

export default Right